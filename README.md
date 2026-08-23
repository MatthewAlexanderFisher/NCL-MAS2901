# MAS2901: Statistical Inference

Quarto source for the Newcastle University MAS2901 statistical inference notes.
The site covers probability foundations, frequentist and Bayesian point
estimation, interval estimation, and hypothesis testing. It also includes a
formula sheet, revision guide, question bank, distribution explorer, and a
browser-based Python IDE.

## Project structure

- `content/main/` contains the ten course chapters.
- `content/appendix/` contains student reference and revision material.
- `content/appendix/_question-bank/` and `_revision-sheet/` contain partial
  files included by their parent pages; they are not standalone chapters.
- `theming/`, `js/`, and `pwa/` contain the presentation and offline features.
- `tools/figures/` contains notebooks used to generate static figures.
- `docs/` is the rendered site used for GitHub Pages publishing.

## Local setup

Install [Quarto](https://quarto.org/) and create the project environment with
Conda or Mamba:

```sh
conda env create -f environment.yml
conda activate mas2901
python -m ipykernel install --user --name mas2901 --display-name "Python (mas2901)"
```

The Jupyter kernel name is configured centrally in `_quarto.yml`.

## Preview and render

Run these commands from the repository root:

```sh
quarto preview
quarto render
```

Rendering writes the site to `docs/`. Commit changes in that directory only
after a successful render. Quarto's `.quarto/` cache and the legacy `_book/`
output are intentionally ignored.

## Maintenance notes

- The web-app manifest assumes the GitHub Pages base path `/NCL-MAS2901/`.
- Increment `CACHE_VERSION` in `service-worker.js` when publishing content or
  asset changes that should immediately invalidate students' offline caches.
- Open `tools/figures/cat-pixel.ipynb` in its own directory when regenerating
  `content/main/part1/figures/cat_pixel.png`.
