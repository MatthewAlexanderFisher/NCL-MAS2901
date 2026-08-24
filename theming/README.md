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
