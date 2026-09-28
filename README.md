# Algorithm Visual Lab

Interactive, fully client-side visualizations of classic algorithms — sorting, searching, graphs, and data structures. No backend; deployable as a static site on GitHub Pages.

**Live:** https://nadeem-majeedch.github.io/Algorithm-Visual-Lab/

## Tech stack

- [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org) (strict)
- [Vite](https://vite.dev) for dev server and production builds
- [Vitest](https://vitest.dev) for unit tests
- [Playwright](https://playwright.dev) for end-to-end tests (run against the production build)
- [ESLint](https://eslint.org) (flat config) for linting
- Plain CSS with design tokens and CSS Modules — no runtime styling dependencies

## Getting started

```bash
npm install
npm run dev        # start the dev server
```

Requires Node 22+ (see `.nvmrc`).

## Scripts

| Script               | Purpose                                        |
| -------------------- | ---------------------------------------------- |
| `npm run dev`        | Vite dev server with HMR                       |
| `npm run build`      | Type-check the app, then build to `dist/`      |
| `npm run preview`    | Serve the production build locally             |
| `npm test`           | Run unit tests once (Vitest)                   |
| `npm run test:watch` | Run unit tests in watch mode                   |
| `npm run test:e2e`   | Run Playwright tests against the built app     |
| `npm run lint`       | Lint all sources with ESLint                   |
| `npm run typecheck`  | Type-check app and node-scope code             |

## Project structure

```
src/
  components/   AppShell, Header, Sidebar, CategorySection, AlgorithmSelector,
                AlgorithmWorkspace, VisualizationPanel, StepInspector,
                PseudocodePanel, ComplexityPanel, PlaybackControls,
                HistoryTimeline, StatusBar (one folder each, CSS Modules)
  features/
    catalog/    algorithmCatalog.ts — 4 categories, 20 algorithms (placeholders)
                + educational metadata (pseudocode, complexity)
  hooks/        useHashRoute — hash routing for GitHub Pages compatibility
  models/       Domain types (catalog shape, findAlgorithm lookup)
  algorithms/   Registry contract (implementations come in a later phase)
  engine/       Playback timing math (engine hook arrives with Phase 2)
  data/         Sample datasets for future visualizers
  utils/        Pure helpers
  styles/       tokens.css (design system), global.css, panels.css
  tests/        Unit tests (Vitest)
e2e/            Playwright end-to-end specs
```

### Architecture principle

Algorithm logic stays **pure and framework-free**: implementations will be generator functions yielding immutable step snapshots, consumed by a playback engine hook and rendered by presentational components. This keeps algorithms trivially unit-testable and the UI replaceable.

Routing is hash-based (`#/bubble-sort`) for GitHub Pages compatibility — no server rewrites required. A `404.html` fallback converts path deep links into hash routes.

The application shell is complete: every algorithm currently renders a placeholder workspace with pseudocode and complexity reference material. Algorithm engines land in the next phase.

## GitHub Pages deployment

The Vite build uses `base: '/Algorithm-Visual-Lab/'`, matching the project-site URL:

```
https://nadeem-majeedch.github.io/Algorithm-Visual-Lab/
```

`npm run build` produces a fully static `dist/` folder; serve it from the `gh-pages` branch or via a GitHub Actions deploy workflow (recommended, to be added).

Application code must always reference assets via `import.meta.env.BASE_URL` — never a hardcoded `/`.

## License

MIT
