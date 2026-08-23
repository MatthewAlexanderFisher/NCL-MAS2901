(function () {
  'use strict';

  if (window.__mas2901KnowledgeGraphInitialised) return;
  window.__mas2901KnowledgeGraphInitialised = true;

  const siteRoot = new URL(window.MAS2901_KNOWLEDGE_GRAPH_ROOT || './', document.baseURI);
  const dataUrl = new URL('knowledge-graph/course-graph.json', siteRoot);
  const cytoscapeUrl = window.MAS2901_KNOWLEDGE_GRAPH_CYTOSCAPE;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const state = {
    data: null,
    nodeById: new Map(),
    partById: new Map(),
    relationshipById: new Map(),
    currentId: null,
    selectedId: null,
    expandedIds: new Set(),
    showAll: false,
    partFilter: 'all',
    view: readStoredView(),
    cy: null,
    dataPromise: null,
    cytoscapePromise: null,
    graphAvailable: true,
    isOpen: false,
    previousFocus: null,
    searchIndex: -1
  };

  const ui = {};

  const reverseRelationshipLabels = {
    prerequisite: 'depends on',
    supports: 'supported by',
    specialisation: 'has special case',
    counterpart: 'counterpart of',
    method: 'has method'
  };

  function readStoredView() {
    try {
      const stored = localStorage.getItem('mas2901-course-map-view');
      return stored === 'list' ? 'list' : 'graph';
    } catch (_) {
      return 'graph';
    }
  }

  function storeView(view) {
    try {
      localStorage.setItem('mas2901-course-map-view', view);
    } catch (_) {
      // The course map still works if storage is unavailable.
    }
  }

  function createIcon(className, fallback) {
    const icon = document.createElement('i');
    icon.className = `bi ${className}`;
    icon.setAttribute('aria-hidden', 'true');
    if (fallback) icon.textContent = fallback;
    return icon;
  }

  function buildInterface() {
    ui.openButton = document.createElement('button');
    ui.openButton.type = 'button';
    ui.openButton.id = 'knowledge-graph-open';
    ui.openButton.className = 'kg-open-button quarto-navigation-tool';
    ui.openButton.title = 'Open course map';
    ui.openButton.setAttribute('aria-label', 'Open course map');
    ui.openButton.setAttribute('aria-controls', 'knowledge-graph-drawer');
    ui.openButton.setAttribute('aria-expanded', 'false');
    ui.openButton.append(createIcon('bi-diagram-3'));
    const buttonLabel = document.createElement('span');
    buttonLabel.className = 'kg-open-button-label';
    buttonLabel.textContent = 'Course map';
    ui.openButton.append(buttonLabel);

    const navbarTools = document.querySelector('#quarto-header .quarto-navbar-tools');
    const colourToggle = navbarTools?.querySelector('.quarto-color-scheme-toggle');
    if (navbarTools) {
      navbarTools.insertBefore(ui.openButton, colourToggle || navbarTools.firstChild);
    } else {
      ui.openButton.classList.add('kg-open-button--floating');
      document.body.append(ui.openButton);
    }

    ui.backdrop = document.createElement('div');
    ui.backdrop.className = 'kg-backdrop';
    ui.backdrop.hidden = true;
    ui.backdrop.innerHTML = `
      <div class="kg-drawer" id="knowledge-graph-drawer" role="dialog" aria-modal="true" aria-labelledby="knowledge-graph-title" aria-describedby="knowledge-graph-subtitle" tabindex="-1">
        <header class="kg-drawer-header">
          <div class="kg-drawer-title-wrap">
            <h2 class="kg-drawer-title" id="knowledge-graph-title">Course map</h2>
            <p class="kg-drawer-subtitle" id="knowledge-graph-subtitle">Explore how the main ideas in MAS2901 connect.</p>
          </div>
          <button class="kg-close-button" type="button" aria-label="Close course map">×</button>
        </header>
        <div class="kg-toolbar">
          <div class="kg-field kg-field--search">
            <label for="knowledge-graph-search">Find a concept</label>
            <input id="knowledge-graph-search" type="search" autocomplete="off" placeholder="e.g. likelihood or confidence interval" disabled>
            <div class="kg-search-results" role="listbox" aria-label="Matching concepts" hidden></div>
          </div>
          <div class="kg-field">
            <label for="knowledge-graph-part">Course part</label>
            <select id="knowledge-graph-part" disabled>
              <option value="all">All parts</option>
            </select>
          </div>
          <button class="kg-button kg-scope-button" type="button" disabled>Show full map</button>
          <div class="kg-view-switch" aria-label="Course map view">
            <button class="kg-view-button" type="button" data-view="graph" aria-pressed="true">Graph</button>
            <button class="kg-view-button" type="button" data-view="list" aria-pressed="false">List</button>
          </div>
        </div>
        <div class="kg-main">
          <section class="kg-map-column" aria-label="Course concepts">
            <div class="kg-status-row">
              <span class="kg-status" role="status" aria-live="polite">Open the map to load course concepts.</span>
              <button class="kg-button kg-reset-button" type="button" disabled>Reset to this page</button>
            </div>
            <div class="kg-graph" role="img" aria-label="Interactive graph of course concepts. Use the list view for keyboard-accessible links."></div>
            <div class="kg-list-view" aria-label="Course concepts as a list" hidden></div>
          </section>
          <section class="kg-detail" aria-label="Selected concept details">
            <p class="kg-empty">Loading the course map…</p>
          </section>
        </div>
        <footer class="kg-legend" aria-label="Relationship legend">
          <span class="kg-legend-item"><span class="kg-legend-line"></span> prerequisite for</span>
          <span class="kg-legend-item"><span class="kg-legend-line kg-legend-line--supports"></span> supports</span>
          <span class="kg-legend-item"><span class="kg-legend-line kg-legend-line--specialisation"></span> special case of</span>
          <span class="kg-legend-item"><span class="kg-legend-line kg-legend-line--counterpart"></span> counterpart of</span>
          <span class="kg-legend-item"><span class="kg-legend-line kg-legend-line--method"></span> method for</span>
        </footer>
      </div>`;

    document.body.append(ui.backdrop);
    ui.drawer = ui.backdrop.querySelector('.kg-drawer');
    ui.closeButton = ui.backdrop.querySelector('.kg-close-button');
    ui.search = ui.backdrop.querySelector('#knowledge-graph-search');
    ui.searchResults = ui.backdrop.querySelector('.kg-search-results');
    ui.partFilter = ui.backdrop.querySelector('#knowledge-graph-part');
    ui.scopeButton = ui.backdrop.querySelector('.kg-scope-button');
    ui.resetButton = ui.backdrop.querySelector('.kg-reset-button');
    ui.viewButtons = Array.from(ui.backdrop.querySelectorAll('.kg-view-button'));
    ui.status = ui.backdrop.querySelector('.kg-status');
    ui.graph = ui.backdrop.querySelector('.kg-graph');
    ui.list = ui.backdrop.querySelector('.kg-list-view');
    ui.detail = ui.backdrop.querySelector('.kg-detail');

    ui.openButton.addEventListener('click', openDrawer);
    ui.closeButton.addEventListener('click', closeDrawer);
    ui.backdrop.addEventListener('click', (event) => {
      if (event.target === ui.backdrop) closeDrawer();
    });
    ui.scopeButton.addEventListener('click', toggleScope);
    ui.resetButton.addEventListener('click', resetToCurrentPage);
    ui.partFilter.addEventListener('change', changePartFilter);
    ui.viewButtons.forEach((button) => button.addEventListener('click', () => setView(button.dataset.view)));
    ui.search.addEventListener('input', updateSearchResults);
    ui.search.addEventListener('keydown', handleSearchKeys);
    document.addEventListener('keydown', handleGlobalKeys);

    applyViewState();
    observeThemeChanges();
  }

  async function loadData() {
    if (state.data) return state.data;
    if (!state.dataPromise) {
      state.dataPromise = fetch(dataUrl)
        .then((response) => {
          if (!response.ok) throw new Error(`Course map data returned ${response.status}.`);
          return response.json();
        })
        .then((data) => {
          validateData(data);
          state.data = data;
          state.nodeById = new Map(data.nodes.map((node) => [node.id, node]));
          state.partById = new Map(data.parts.map((part) => [part.id, part]));
          state.relationshipById = new Map(data.relationshipTypes.map((relationship) => [relationship.id, relationship]));
          populatePartFilter();
          enableControls();
          return data;
        });
    }
    return state.dataPromise;
  }

  function validateData(data) {
    if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
      throw new Error('Course map data must contain node and edge arrays.');
    }
    const nodeIds = new Set();
    const partIds = new Set((data.parts || []).map((part) => part.id));
    const relationshipIds = new Set((data.relationshipTypes || []).map((relationship) => relationship.id));
    for (const node of data.nodes) {
      if (!node.id || nodeIds.has(node.id)) throw new Error(`Duplicate or missing course map node: ${node.id || '(missing id)'}.`);
      if (!node.label || !node.href || !partIds.has(node.part)) throw new Error(`Incomplete course map node: ${node.id}.`);
      nodeIds.add(node.id);
    }
    const edgeIds = new Set();
    for (const edge of data.edges) {
      if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) throw new Error(`Course map edge has an unknown endpoint: ${edge.source} → ${edge.target}.`);
      if (!relationshipIds.has(edge.type)) throw new Error(`Course map edge has an unknown relationship: ${edge.type}.`);
      const edgeId = `${edge.source}|${edge.target}|${edge.type}`;
      if (edgeIds.has(edgeId)) throw new Error(`Duplicate course map edge: ${edgeId}.`);
      edgeIds.add(edgeId);
    }
  }

  function ensureCytoscape() {
    if (window.cytoscape) return Promise.resolve(window.cytoscape);
    if (!cytoscapeUrl) return Promise.reject(new Error('The Cytoscape asset URL is unavailable.'));
    if (!state.cytoscapePromise) {
      state.cytoscapePromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = cytoscapeUrl;
        script.dataset.mas2901KnowledgeGraphLibrary = 'cytoscape';
        script.onload = () => window.cytoscape ? resolve(window.cytoscape) : reject(new Error('Cytoscape did not initialise.'));
        script.onerror = () => reject(new Error('Cytoscape could not be loaded.'));
        document.body.append(script);
      });
    }
    return state.cytoscapePromise;
  }

  function populatePartFilter() {
    const fragment = document.createDocumentFragment();
    [...state.data.parts]
      .sort((a, b) => a.order - b.order)
      .forEach((part) => {
        const option = document.createElement('option');
        option.value = part.id;
        option.textContent = part.shortLabel || part.label;
        fragment.append(option);
      });
    ui.partFilter.append(fragment);
  }

  function enableControls() {
    ui.search.disabled = false;
    ui.partFilter.disabled = false;
    ui.scopeButton.disabled = false;
    ui.resetButton.disabled = false;
  }

  async function openDrawer() {
    if (state.isOpen) return;
    state.isOpen = true;
    state.previousFocus = document.activeElement;
    ui.backdrop.hidden = false;
    document.body.classList.add('kg-drawer-open');
    ui.openButton.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => ui.backdrop.classList.add('is-open'));
    ui.drawer.focus();

    try {
      await loadData();
      state.currentId = resolveCurrentNode();
      state.selectedId = state.currentId;
      state.showAll = false;
      state.partFilter = 'all';
      ui.partFilter.value = 'all';
      state.expandedIds = neighbourhood(state.currentId);
      setLoadingStatus('Preparing the interactive map…');

      try {
        await ensureCytoscape();
        state.graphAvailable = true;
        initialiseGraph();
      } catch (error) {
        state.graphAvailable = false;
        state.view = 'list';
        console.warn('The interactive graph is unavailable; using the course-map list instead.', error);
      }

      renderAll();
      window.setTimeout(() => {
        if (!state.isOpen || !state.cy || state.view !== 'graph') return;
        state.cy.resize();
        state.cy.fit(undefined, 38);
      }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 260);
    } catch (error) {
      console.error('Unable to initialise the course map.', error);
      ui.status.textContent = 'The course map could not be loaded.';
      ui.detail.replaceChildren(createMessage('The course map is temporarily unavailable. Please use the chapter navigation instead.'));
      setView('list');
    }
  }

  function closeDrawer() {
    if (!state.isOpen) return;
    state.isOpen = false;
    ui.backdrop.classList.remove('is-open');
    document.body.classList.remove('kg-drawer-open');
    ui.openButton.setAttribute('aria-expanded', 'false');
    hideSearchResults();
    window.setTimeout(() => {
      if (!state.isOpen) ui.backdrop.hidden = true;
    }, reducedMotion.matches ? 0 : 230);
    if (state.previousFocus instanceof HTMLElement) state.previousFocus.focus();
  }

  function handleGlobalKeys(event) {
    if (!state.isOpen) return;
    if (event.key === 'Escape') {
      if (!ui.searchResults.hidden) {
        hideSearchResults();
        return;
      }
      closeDrawer();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = Array.from(ui.drawer.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'))
      .filter((element) => !element.hidden && element.getClientRects().length > 0);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function resolveCurrentNode() {
    const currentPath = normalisePath(window.location.pathname);
    const currentHash = window.location.hash;
    const candidates = state.data.nodes.filter((node) => {
      const url = topicUrl(node);
      return normalisePath(url.pathname) === currentPath;
    });
    if (!candidates.length) return state.data.nodes[0].id;

    if (currentHash) {
      const exact = candidates.find((node) => topicUrl(node).hash === currentHash);
      if (exact) return exact.id;
    }

    const anchored = candidates
      .map((node) => {
        const hash = topicUrl(node).hash.slice(1);
        const element = hash ? document.getElementById(decodeURIComponent(hash)) : null;
        return element ? { node, top: element.getBoundingClientRect().top } : null;
      })
      .filter(Boolean);
    const readingLine = window.innerHeight * 0.35;
    const passed = anchored.filter((candidate) => candidate.top <= readingLine).sort((a, b) => b.top - a.top);
    if (passed.length) return passed[0].node.id;
    const closest = anchored.sort((a, b) => Math.abs(a.top - readingLine) - Math.abs(b.top - readingLine))[0];
    if (closest) return closest.node.id;
    return (candidates.find((node) => node.defaultForPage) || candidates[0]).id;
  }

  function normalisePath(path) {
    return decodeURIComponent(path).replace(/\/index\.html$/, '/').replace(/\/+$/, '');
  }

  function topicUrl(node) {
    return new URL(node.href, siteRoot);
  }

  function neighbourhood(nodeId) {
    const ids = new Set([nodeId]);
    if (!state.data || !nodeId) return ids;
    state.data.edges.forEach((edge) => {
      if (edge.source === nodeId) ids.add(edge.target);
      if (edge.target === nodeId) ids.add(edge.source);
    });
    return ids;
  }

  function expandAround(nodeId) {
    neighbourhood(nodeId).forEach((id) => state.expandedIds.add(id));
  }

  function visibleNodes() {
    if (!state.data) return [];
    let nodes = state.showAll
      ? [...state.data.nodes]
      : state.data.nodes.filter((node) => state.expandedIds.has(node.id));
    if (state.partFilter !== 'all') nodes = nodes.filter((node) => node.part === state.partFilter);
    return nodes;
  }

  function visibleEdges(nodes) {
    const ids = new Set(nodes.map((node) => node.id));
    return state.data.edges.filter((edge) => ids.has(edge.source) && ids.has(edge.target));
  }

  function initialiseGraph() {
    if (state.cy || !state.graphAvailable || !window.cytoscape) return;
    state.cy = window.cytoscape({
      container: ui.graph,
      elements: [],
      style: graphStyles(),
      minZoom: 0.35,
      maxZoom: 2.4,
      wheelSensitivity: 0.18,
      boxSelectionEnabled: false,
      autoungrabify: false
    });
    state.cy.on('tap', 'node', (event) => selectNode(event.target.id()));
  }

  function graphStyles() {
    const palette = getPalette();
    return [
      {
        selector: 'node',
        style: {
          'background-color': 'data(color)',
          'border-color': palette.background,
          'border-width': 2,
          'color': palette.foreground,
          'font-family': getComputedStyle(document.body).fontFamily,
          'font-size': 12,
          'font-weight': 600,
          'height': 52,
          'label': 'data(label)',
          'padding': 7,
          'shape': 'round-rectangle',
          'text-halign': 'center',
          'text-max-width': 126,
          'text-outline-color': palette.background,
          'text-outline-opacity': 0.94,
          'text-outline-width': 3,
          'text-valign': 'center',
          'text-wrap': 'wrap',
          'width': 136
        }
      },
      {
        selector: 'node.current',
        style: {
          'border-color': palette.series5,
          'border-width': 5
        }
      },
      {
        selector: 'node:selected',
        style: {
          'border-color': palette.foreground,
          'border-width': 4,
          'overlay-color': palette.series5,
          'overlay-opacity': 0.08,
          'overlay-padding': 7
        }
      },
      {
        selector: 'edge',
        style: {
          'curve-style': 'bezier',
          'line-color': palette.muted,
          'line-opacity': 0.68,
          'target-arrow-color': palette.muted,
          'target-arrow-shape': 'triangle',
          'arrow-scale': 0.85,
          'width': 2
        }
      },
      {
        selector: 'edge[type = "supports"]',
        style: { 'line-style': 'dashed' }
      },
      {
        selector: 'edge[type = "specialisation"]',
        style: { 'line-style': 'dotted' }
      },
      {
        selector: 'edge[type = "counterpart"]',
        style: {
          'line-style': 'dashed',
          'target-arrow-shape': 'none',
          'width': 3
        }
      },
      {
        selector: 'edge[type = "method"]',
        style: {
          'line-color': palette.series1,
          'line-style': 'dashed',
          'target-arrow-color': palette.series1
        }
      },
      {
        selector: 'edge.active-edge',
        style: {
          'color': palette.foreground,
          'font-family': getComputedStyle(document.body).fontFamily,
          'font-size': 9,
          'label': 'data(typeLabel)',
          'line-opacity': 1,
          'text-background-color': palette.background,
          'text-background-opacity': 0.92,
          'text-background-padding': 2,
          'text-rotation': 'autorotate',
          'width': 3,
          'z-index': 8
        }
      }
    ];
  }

  function getPalette() {
    const style = getComputedStyle(document.documentElement);
    const value = (name, fallback) => style.getPropertyValue(name).trim() || fallback;
    return {
      background: value('--plot-bg', value('--bs-body-bg', '#ffffff')),
      foreground: value('--plot-fg', value('--bs-body-color', '#212529')),
      muted: value('--plot-muted', '#68737d'),
      series1: value('--plot-series-1', '#007c91'),
      series2: value('--plot-series-2', '#c74b24'),
      series3: value('--plot-series-3', '#6f5aa8'),
      series4: value('--plot-series-4', '#2e7d32'),
      series5: value('--plot-series-5', '#ad5a00')
    };
  }

  function partColours() {
    const palette = getPalette();
    return {
      foundations: palette.series1,
      'point-estimation': palette.series2,
      'interval-estimation': palette.series3,
      'hypothesis-testing': palette.series4
    };
  }

  function renderGraph() {
    if (!state.cy || !state.graphAvailable) return;
    const nodes = visibleNodes();
    const edges = visibleEdges(nodes);
    const colours = partColours();
    const elements = [
      ...nodes.map((node) => ({
        group: 'nodes',
        data: { ...node, color: colours[node.part] || getPalette().series5 },
        classes: node.id === state.currentId ? 'current' : ''
      })),
      ...edges.map((edge, index) => ({
        group: 'edges',
        data: {
          id: `kg-edge-${index}-${edge.source}-${edge.target}`,
          ...edge,
          typeLabel: state.relationshipById.get(edge.type)?.label || edge.type
        }
      }))
    ];
    state.cy.batch(() => {
      state.cy.elements().remove();
      state.cy.add(elements);
      state.cy.style(graphStyles());
    });
    const selected = state.cy.$id(state.selectedId);
    if (selected.length) selected.select();
    highlightSelectedEdges();

    const animate = !reducedMotion.matches && nodes.length <= 28;
    state.cy.layout({
      name: 'cose',
      animate,
      animationDuration: 280,
      componentSpacing: 90,
      fit: true,
      gravity: 0.35,
      idealEdgeLength: nodes.length > 30 ? 85 : 115,
      nodeOverlap: 18,
      nodeRepulsion: nodes.length > 30 ? 260000 : 420000,
      padding: 38,
      randomize: true
    }).run();
  }

  function highlightSelectedEdges() {
    if (!state.cy) return;
    state.cy.edges().removeClass('active-edge');
    const selected = state.cy.$id(state.selectedId);
    if (selected.length) selected.connectedEdges().addClass('active-edge');
  }

  function updateGraphTheme() {
    if (!state.cy || !state.data) return;
    const colours = partColours();
    state.cy.nodes().forEach((node) => node.data('color', colours[node.data('part')]));
    state.cy.style(graphStyles());
    state.cy.style().update();
    renderList();
  }

  function observeThemeChanges() {
    let queued = false;
    const update = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        updateGraphTheme();
      });
    };
    const observer = new MutationObserver(update);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class', 'style'] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });
  }

  function renderAll() {
    if (!state.data) return;
    if (!state.nodeById.has(state.selectedId)) state.selectedId = visibleNodes()[0]?.id || state.data.nodes[0].id;
    applyViewState();
    renderGraph();
    renderList();
    renderDetails();
    updateStatus();
    ui.scopeButton.textContent = state.showAll ? 'Show local map' : 'Show full map';
  }

  function renderList() {
    if (!state.data) return;
    const nodes = visibleNodes();
    const colours = partColours();
    const fragment = document.createDocumentFragment();
    const orderedParts = [...state.data.parts].sort((a, b) => a.order - b.order);
    orderedParts.forEach((part) => {
      const partNodes = nodes.filter((node) => node.part === part.id);
      if (!partNodes.length) return;
      const section = document.createElement('section');
      section.className = 'kg-list-part';
      const heading = document.createElement('h3');
      heading.textContent = part.label;
      const list = document.createElement('ul');
      partNodes.forEach((node) => {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.className = 'kg-list-link';
        if (node.id === state.currentId) link.classList.add('is-current');
        if (node.id === state.selectedId) link.classList.add('is-selected');
        link.href = topicUrl(node).href;
        link.dataset.nodeId = node.id;
        const dot = document.createElement('span');
        dot.className = 'kg-list-dot';
        dot.style.setProperty('--kg-node-color', colours[node.part]);
        const label = document.createElement('span');
        label.textContent = node.label;
        link.append(dot, label);
        link.addEventListener('click', closeDrawer);
        link.addEventListener('focus', () => selectNode(node.id, { renderGraph: false }));
        item.append(link);
        list.append(item);
      });
      section.append(heading, list);
      fragment.append(section);
    });
    ui.list.replaceChildren(fragment);
    if (!nodes.length) ui.list.append(createMessage('No concepts match this filter.'));
  }

  function renderDetails() {
    if (!state.data) return;
    const node = state.nodeById.get(state.selectedId);
    if (!node) {
      ui.detail.replaceChildren(createMessage('Select a concept to see how it connects.'));
      return;
    }
    const fragment = document.createDocumentFragment();
    const part = document.createElement('p');
    part.className = 'kg-detail-part';
    part.textContent = state.partById.get(node.part)?.label || node.part;
    fragment.append(part);
    if (node.id === state.currentId) {
      const badge = document.createElement('span');
      badge.className = 'kg-current-badge';
      badge.textContent = 'Current page context';
      fragment.append(badge);
    }
    const heading = document.createElement('h3');
    heading.textContent = node.label;
    const description = document.createElement('p');
    description.className = 'kg-detail-description';
    description.textContent = node.description;
    const link = document.createElement('a');
    link.className = 'kg-topic-link';
    link.href = topicUrl(node).href;
    link.append(document.createTextNode('Open topic '), createIcon('bi-arrow-right'));
    link.addEventListener('click', closeDrawer);
    fragment.append(heading, description, link);

    const connections = state.data.edges
      .filter((edge) => edge.source === node.id || edge.target === node.id)
      .map((edge) => {
        const outgoing = edge.source === node.id;
        const otherId = outgoing ? edge.target : edge.source;
        const relationship = state.relationshipById.get(edge.type);
        return {
          other: state.nodeById.get(otherId),
          phrase: outgoing ? relationship.label : reverseRelationshipLabels[edge.type] || relationship.label
        };
      })
      .sort((a, b) => a.other.label.localeCompare(b.other.label));
    if (connections.length) {
      const connectionsHeading = document.createElement('h4');
      connectionsHeading.textContent = 'Connections';
      const list = document.createElement('ul');
      list.className = 'kg-relations';
      connections.forEach(({ other, phrase }) => {
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'kg-relation-button';
        const relation = document.createElement('span');
        relation.className = 'kg-relation-label';
        relation.textContent = `${phrase} `;
        const label = document.createElement('strong');
        label.textContent = other.label;
        button.append(relation, label);
        button.addEventListener('click', () => selectNode(other.id));
        item.append(button);
        list.append(item);
      });
      fragment.append(connectionsHeading, list);
    }
    ui.detail.replaceChildren(fragment);
  }

  function createMessage(text) {
    const message = document.createElement('p');
    message.className = 'kg-empty';
    message.textContent = text;
    return message;
  }

  function selectNode(nodeId, options = {}) {
    if (!state.nodeById.has(nodeId)) return;
    if (state.partFilter !== 'all' && state.nodeById.get(nodeId).part !== state.partFilter) {
      state.partFilter = 'all';
      ui.partFilter.value = 'all';
    }
    state.selectedId = nodeId;
    expandAround(nodeId);
    if (options.renderGraph === false) {
      renderDetails();
      updateStatus();
      return;
    }
    renderAll();
    if (state.cy) {
      const selected = state.cy.$id(nodeId);
      if (selected.length) {
        selected.select();
        state.cy.animate({ center: { eles: selected }, zoom: Math.max(state.cy.zoom(), 0.85), duration: reducedMotion.matches ? 0 : 220 });
      }
    }
  }

  function toggleScope() {
    state.showAll = !state.showAll;
    renderAll();
  }

  function resetToCurrentPage() {
    state.currentId = resolveCurrentNode();
    state.selectedId = state.currentId;
    state.expandedIds = neighbourhood(state.currentId);
    state.showAll = false;
    state.partFilter = 'all';
    ui.partFilter.value = 'all';
    ui.search.value = '';
    hideSearchResults();
    renderAll();
  }

  function changePartFilter() {
    state.partFilter = ui.partFilter.value;
    const selected = state.nodeById.get(state.selectedId);
    if (state.partFilter !== 'all' && selected?.part !== state.partFilter) {
      const replacement = state.data.nodes.find((node) => node.part === state.partFilter);
      if (replacement) {
        state.selectedId = replacement.id;
        expandAround(replacement.id);
      }
    }
    renderAll();
  }

  function setView(view) {
    state.view = view === 'list' || !state.graphAvailable ? 'list' : 'graph';
    storeView(state.view);
    applyViewState();
    if (state.view === 'graph' && state.cy) {
      state.cy.resize();
      state.cy.fit(undefined, 38);
    }
  }

  function applyViewState() {
    if (!state.graphAvailable && state.view === 'graph') state.view = 'list';
    const graphView = state.view === 'graph';
    ui.graph.hidden = !graphView;
    ui.list.hidden = graphView;
    ui.viewButtons.forEach((button) => {
      const active = button.dataset.view === state.view;
      button.setAttribute('aria-pressed', String(active));
      button.disabled = button.dataset.view === 'graph' && !state.graphAvailable;
    });
  }

  function updateStatus() {
    if (!state.data) return;
    const count = visibleNodes().length;
    const selected = state.nodeById.get(state.selectedId);
    const mode = state.showAll ? 'full map' : 'local map';
    ui.status.textContent = `${count} of ${state.data.nodes.length} concepts shown in the ${mode}${selected ? `; ${selected.label} selected` : ''}.`;
  }

  function setLoadingStatus(text) {
    ui.status.textContent = text;
  }

  function updateSearchResults() {
    if (!state.data) return;
    const query = ui.search.value.trim().toLowerCase();
    state.searchIndex = -1;
    if (!query) {
      hideSearchResults();
      return;
    }
    const matches = state.data.nodes
      .filter((node) => `${node.label} ${node.description}`.toLowerCase().includes(query))
      .slice(0, 8);
    const fragment = document.createDocumentFragment();
    matches.forEach((node) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'kg-search-result';
      button.setAttribute('role', 'option');
      button.setAttribute('aria-selected', 'false');
      button.dataset.nodeId = node.id;
      const label = document.createElement('strong');
      label.textContent = node.label;
      const part = document.createElement('span');
      part.className = 'kg-search-result-part';
      part.textContent = state.partById.get(node.part)?.shortLabel || state.partById.get(node.part)?.label || node.part;
      button.append(label, part);
      button.addEventListener('click', () => chooseSearchResult(node.id));
      fragment.append(button);
    });
    ui.searchResults.replaceChildren(fragment);
    if (!matches.length) ui.searchResults.append(createMessage('No matching concepts.'));
    ui.searchResults.hidden = false;
  }

  function handleSearchKeys(event) {
    const options = Array.from(ui.searchResults.querySelectorAll('.kg-search-result'));
    if (event.key === 'Escape') {
      event.stopPropagation();
      hideSearchResults();
      return;
    }
    if (!options.length || ui.searchResults.hidden) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      state.searchIndex = (state.searchIndex + 1) % options.length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      state.searchIndex = (state.searchIndex - 1 + options.length) % options.length;
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const index = state.searchIndex >= 0 ? state.searchIndex : 0;
      chooseSearchResult(options[index].dataset.nodeId);
      return;
    } else {
      return;
    }
    options.forEach((option, index) => option.setAttribute('aria-selected', String(index === state.searchIndex)));
  }

  function chooseSearchResult(nodeId) {
    ui.search.value = state.nodeById.get(nodeId)?.label || '';
    hideSearchResults();
    selectNode(nodeId);
  }

  function hideSearchResults() {
    ui.searchResults.hidden = true;
    state.searchIndex = -1;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildInterface, { once: true });
  } else {
    buildInterface();
  }
})();
