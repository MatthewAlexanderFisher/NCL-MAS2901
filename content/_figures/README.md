# OJS figures

Interactive figures are kept here so that chapter files can focus on teaching content.

- Figures are grouped by course part, with appendix figures under `appendix/`.
- Each figure partial keeps its controls, state, calculations, plot, and local styles together. Observable resolves reactive dependencies independently of source order, which allows a stable control view to be placed after its plot.
- Files ending in `-shared.qmd`, plus the distribution explorer's `shared.qmd`, define page-level values used by figures later on the same page. Include these before any figure that depends on them.
- Figure partials use the central light/dark palette from `light_theme.scss` and `dark_theme.scss`; do not add local theme palettes.
- Include a figure from its chapter using a Quarto include, for example:

  ```markdown
  {{< include ../../_figures/part2/binomial-likelihood.qmd >}}
  ```

The question-bank filtering OJS remains in `content/appendix/question-bank.qmd` because it controls the page rather than drawing a figure.

## Stable reactive controls

Render each `viewof` control panel in its own OJS output cell, normally immediately after the plot cell so that the panel appears below the figure. Plot and explanatory cells should depend on the control's value (for example, `controls.n`) but must not interpolate the control element itself (for example, `${viewof controls}`) inside markup that rerenders when the value changes.

Keeping the control view separate leaves its DOM node mounted while dependent plots redraw. Embedding it in a reactive plot template replaces the active slider on the first input event, which interrupts pointer drags and keyboard entry.

## Quarto render note

Quarto expands these includes before executing their OJS cells, so shared values and reactive dependencies behave as if the code were still inline. The current Quarto release may print `OJS block count mismatch` once per included cell: the warning only means that a later OJS error could be reported against an inaccurate source line, because Quarto counts line locations in the parent file before expanding includes. It does not indicate a cell-count or dependency failure.
