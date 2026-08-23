# Course knowledge graph

This directory contains the expandable course map shown on every HTML page.

- `course-graph.json` is the single source of truth for concepts and relationships.
- `knowledge-graph.js` builds the drawer, accessible list view, search and interactive graph.
- `knowledge-graph.css` uses the shared light/dark figure palette.
- `widget.html` loads the component relative to Quarto's site root.
- `vendor/` contains the pinned Cytoscape.js browser bundle and its licence.

## Editing the graph

Each node needs a unique `id`, student-facing `label`, course `part`, short `description`, and an `href` relative to the rendered site root. Use `defaultForPage` on one node per core chapter so the drawer has a sensible starting point when the page is at its top.

Edges use `source`, `target`, and one of the relationship types declared at the top of the JSON file. A `prerequisite` edge points from prerequisite to dependent concept. `counterpart` relationships are displayed without a directional arrow.

After changing the data, render the book. The validation checks should confirm that every node and edge is valid and that every linked HTML anchor exists.
