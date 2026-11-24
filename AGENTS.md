# AGENTS.md

Instructions for coding agents (Claude Code, Codex and others). Users of the package: see [README.md](README.md).

## Project

`@mheob/changeset-changelog` is a changelog generator for [Changesets](https://github.com/changesets/changesets), published to npm. Changesets loads it through `.changeset/config.json` (`"changelog": ["@mheob/changeset-changelog", { "repo": "org/repo" }]`) and calls `getReleaseLine` and `getDependencyReleaseLine` (`src/index.ts`). The output format is documented in the README; a change to it is a change for every user.

## Stack and toolchain

- **Vite+ is the only toolchain** (`vite-plus`, CLI `vp`): `vp check` (format, lint, types), `vp fmt`, `vp lint`, `vp test`, `vp pack` (library build).
  - Configure only in `vite.config.ts`: the `fmt`, `lint`, `pack`, `staged` and `test` blocks.
  - Do not add `vitest.config.ts`, `tsdown.config.ts`, `oxlint.config.ts`, `.oxlintrc.json`, `.oxfmtrc.json`, ESLint, Prettier, Husky or lint-staged.
  - Tests import from `vite-plus/test`, Vite APIs from `vite-plus` (lint rule `vite-plus/prefer-vite-plus-imports`).
  - Formatting and linting come from `@mheob/oxfmt-config` and `@mheob/oxlint-config`.
- **The build** (`vp pack`) writes `dist/index.mjs` (ESM) and `dist/index.cjs` (CommonJS). Changesets loads a changelog generator with `require()`, so the CommonJS build must stay.
- **pnpm 12** with `catalogMode: strict` in `pnpm-workspace.yaml`.
  - Every dependency is `"catalog:"` in `package.json`. Versions live only in the catalog.
  - Run `pnpm check:catalog` and `pnpm check:vite-plus` after touching dependencies. The Vite+ versions (`vite-plus`, `vite`, `vitest`, `@vitest/coverage-v8`) move together.
  - `minimumReleaseAge` installs only versions that are at least a day old.
- **Node.js 26** (`.node-version`) for development and CI. The package supports Node.js 24.21.0 and newer (`engines.node`); CI runs the tests on both. `@types/node` stays on 24, so the code uses no newer API.
- **Git hooks** live in `.vite-hooks/` and are installed by `pnpm install` (`prepare`: `vp config`): commitlint on `commit-msg`, `vp staged` on `pre-commit`, `vp install` on `post-merge` when the lockfile changed.

## Commands

Run them from the repository root.

| Task | Command |
| --- | --- |
| Install (also installs the Git hooks) | `pnpm install` |
| Format, lint, types | `vp check` (`vp check --fix` fixes what it can) |
| Format only | `vp fmt` |
| Tests (watch mode) | `vp test` |
| Tests once, with coverage (`coverage/lcov.info`, uploaded to Codecov) | `vp test run --coverage` |
| One test file | `vp test run src/get-release-line.test.ts` |
| Build | `vp pack` |
| Catalog and Vite+ version checks | `pnpm check:catalog`, `pnpm check:vite-plus` |
| Commit (czg) | `pnpm commit` |
| Add a changeset | `pnpm changeset` |

A change is done when `vp check` reports 0 errors and 0 warnings, `vp test run` passes and `vp pack` builds.

## Conventions

- Commit messages follow Conventional Commits (`@mheob/commitlint-config`).
- Every change to the published package (`src/`, `package.json`) gets a changeset; Changesets writes `CHANGELOG.md`, which is not formatted by hand.
- Tests sit next to the code (`*.test.ts`) and mock `@changesets/get-github-info` with `vi.mock(import(…))` and `vi.mocked(…)`.
- Releases: `.github/workflows/release.yml` opens the release pull request and publishes to npm once it is merged. It writes to GitHub with the token of the release GitHub App (variable `BOT_CLIENT_ID`, secret `BOT_PRIVATE_KEY`) and publishes to npm through trusted publishing (OIDC, `id-token: write`, configured on npmjs.com for `release.yml`), without an npm token. The workflow's file name must stay `release.yml`.
