# @mheob/changeset-changelog

## 3.0.3

### Patch Changes

- [#127](https://github.com/mheob/changeset-changelog/pull/127) ([@mheob](https://github.com/mheob)): Support Node.js 26 and newer: `engines.node` is now `>=24.21.0` (was `^24.21.0`).

- [#127](https://github.com/mheob/changeset-changelog/pull/127) ([@mheob](https://github.com/mheob)): Update `@changesets/get-github-info` to v1 and `@changesets/types` to v7 (the types of Changesets v3). A commit or pull request that GitHub does not know no longer fails the changelog; its release line is written without that link.

  Drop `dotenv`: `@changesets/get-github-info` now reads `GITHUB_TOKEN` (and `GITHUB_SERVER_URL`, `GITHUB_GRAPHQL_URL`) from the environment or from a `.env` file in the working directory itself. Other variables of the `.env` file are no longer loaded into `process.env`.

- [#127](https://github.com/mheob/changeset-changelog/pull/127) ([@mheob](https://github.com/mheob)): Build the package with Vite+. The CommonJS entry is now `dist/index.cjs` (was `dist/index.js`); imports through the package name stay the same.

## 3.0.2

### Patch Changes

- [#93](https://github.com/mheob/changeset-changelog/pull/93) ([@mheob](https://github.com/mheob)): update all dependencies

- [#53](https://github.com/mheob/changeset-changelog/pull/53) ([@renovate](https://github.com/apps/renovate)): chore(deps): update
  all non-major dependencies

## 3.0.1

### Patch Changes

- [#31](https://github.com/mheob/changeset-changelog/pull/31) ([@mheob](https://github.com/mheob)): update dependencies

- [#47](https://github.com/mheob/changeset-changelog/pull/47) ([@renovate](https://github.com/apps/renovate)): chore(deps): update
  dependency lint-staged to v15

- [#39](https://github.com/mheob/changeset-changelog/pull/39) ([@renovate](https://github.com/apps/renovate)): chore(deps): update
  all non-major dependencies

- [#44](https://github.com/mheob/changeset-changelog/pull/44) ([@renovate](https://github.com/apps/renovate)): chore(deps): update
  all non-major dependencies

- [#45](https://github.com/mheob/changeset-changelog/pull/45) ([@dependabot](https://github.com/apps/dependabot)):
  chore(deps-dev): [security] bump @babel/traverse from 7.23.0 to 7.23.2

- [#43](https://github.com/mheob/changeset-changelog/pull/43) ([@mheob](https://github.com/mheob)): chore(deps): update
  dependencies

## 3.0.0

### Major Changes

- [#27](https://github.com/mheob/changeset-changelog/pull/27) ([@mheob](https://github.com/mheob)): reformat the changelog output
  to display first the PR and user

## 2.0.1

### Patch Changes

- [#23](https://github.com/mheob/changeset-changelog/pull/23) ([@mheob](https://github.com/mheob)): reduce the package size to a
  minium

- [#17](https://github.com/mheob/changeset-changelog/pull/17) ([@renovate](https://github.com/apps/renovate)): chore(deps): update
  all non-major dependencies

## 2.0.0

### Major Changes

- [#10](https://github.com/mheob/changeset-changelog/pull/10) ([@mheob](https://github.com/mheob)): complete rewrite of the code
  and output

### Patch Changes

- [#11](https://github.com/mheob/changeset-changelog/pull/11) ([@mheob](https://github.com/mheob)): cleanup repository

## 1.0.0

### Major Changes

- [#1](https://github.com/mheob/changeset-changelog/pull/1) ([@mheob](https://github.com/mheob)): Initial creation of the package
