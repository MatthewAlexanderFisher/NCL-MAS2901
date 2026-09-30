# Course knowledge graph

This directory contains the course map shown on every HTML page.

The overview groups the complete catalogue by chapter. The connections view
shows one selected concept and its immediate neighbours in fixed columns;
following a connection replaces the neighbourhood instead of accumulating nodes.
Links are routed between the cards and relationship descriptions stay in the
details panel. On narrow screens, the connections use the same accessible
buttons in the details panel instead of shrinking a diagram to unreadable sizes.
The list view provides direct links to every entry in the selected course part.

- `course-graph.json` is the single source of truth for concepts and relationships.
- `knowledge-graph.js` builds the drawer, accessible list view, search and interactive graph.
- `knowledge-graph.css` uses the shared light/dark figure palette.
- `widget.html` loads the component relative to Quarto's site root.
- `vendor/` contains the pinned Cytoscape.js browser bundle and its licence.

## Editing the graph

Each node needs a unique `id`, student-facing `label`, course `part`, `chapter`,
short `description`, and an `href` relative to the rendered site root. The
`chapters` array defines the overview cards in reading order, including study
resources. Use `defaultForPage` on exactly one node per active page so the drawer
has a sensible starting point at the top of a page. Optional `aliases` improve
search (for example, Gaussian or BvM); `optional: true` labels material explicitly
identified as not examinable in the notes.

The widget's asset URLs, catalogue fetch and service-worker precache share a
schema version in their query string. Update these together when changing the
data format so an older offline cache cannot pair the new UI with an incompatible
catalogue.

Edges use `source`, `target`, and one of the relationship types declared at the top of the JSON file. A `prerequisite` edge points from prerequisite to dependent concept. `counterpart` relationships are displayed without a directional arrow.

After changing the data, render the book and run `python3 knowledge-graph/check-map.py`.
This checks IDs, chapter membership, active-page coverage, defaults, relationships
and every linked HTML anchor. Keep the catalogue aligned with active chapters in
`_quarto.yml`; the distribution explorer is linked within the Formula Sheet.
