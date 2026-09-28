# Styling architecture

The site has one compiled style entry point: `site.scss`.

`light_theme.scss` and `dark_theme.scss` define the mode-specific palette and
CSS custom properties, then include the shared bundle through Quarto's
`scss:uses` and `scss:rules` layers. Quarto therefore emits the shared styles
inside each native light/dark Bootstrap theme rather than linking many separate
stylesheets on every page.

## Where changes belong

- Put theme colours and semantic tokens in `light_theme.scss` and
  `dark_theme.scss`.
- Put component and layout rules in a focused CSS module under `theming/`.
- Register every new module once, in cascade order, in `site.scss`.
- Keep `include-after-body` HTML files concerned with markup and behaviour;
  their presentation belongs in a CSS module.
- Prefer the existing semantic custom properties (`--brand-*`, `--plot-*`,
  `--surface*`, `--border`, and reader-support tokens) over raw colour values.

The order in `site.scss` is intentional. General typography and layout load
first, followed by components and finally the styles for UI injected by the
HTML includes. Later modules may refine earlier ones, so reorder them only with
a visual regression check in both colour modes.

The `accessibility` module supplies shared focus, contrast and reflow rules.
`accessibility.html` enhances Quarto disclosures and dynamically generated
Observable controls, and makes overflowing tables and equations keyboard
scrollable. Keep explicit accessible names in custom controls; the shared input
labelling is a fallback for Observable's generated range/number pairs. Add
`fig-alt` to new instructional images, including every light/dark rendering.

## Printing and PDF downloads

`print-button.html` creates an isolated, static print view from the rendered
chapter content. It supports one chapter, the current part, selected chapters,
or the whole book. It waits for Observable outputs, fonts and images, preserves
current input values, resolves assets against each source chapter, and gives
each chapter its own IDs so combined-document links remain valid. Failed loads
are reported instead of silently omitting chapters. The preview stays open for
review or another print attempt.

`print-layout.css` is the last shared style module. It controls paper typography,
page flow, tables, figures and theme-independent white backgrounds. Long
callouts and tables can break across pages; only short boxes and individual
plots are kept together. Wide equations and tables are fitted in the print view.
Avoid blanket `break-inside: avoid` on chapter containers or all callouts.

The browser's own Print command uses the same layout, expands explanations and
tabs, and restores the original display afterwards. The header button adds A4
or Letter, layout, content-expansion and page-furniture options. Course headings
and page numbers use CSS page margins, whose support depends on the browser;
they do not use fixed elements that overlap lecture content. Turn off the
browser's own headers and footers when using these options.

When changing print code, test a chapter with tabsets and tables, one with long
proofs and equations, and a combined export with images from different source
directories. Render the PDFs and inspect actual pages, including transitions.
Also check dark-mode printing and that cancelling native print restores open
panels and active tabs. Screen-only layout changes must not alter print output.
