# `@mheob/changeset-changelog`

[![Release](https://github.com/mheob/changeset-changelog/actions/workflows/release.yml/badge.svg)](https://github.com/mheob/changeset-changelog/actions/workflows/release.yml)
[![Check](https://github.com/mheob/changeset-changelog/actions/workflows/check.yml/badge.svg)](https://github.com/mheob/changeset-changelog/actions/workflows/check.yml)
[![codecov](https://codecov.io/gh/mheob/changeset-changelog/branch/main/graph/badge.svg?token=E7RZLWHMEX)](https://codecov.io/gh/mheob/changeset-changelog)

Add my own style for the changelogs generated by the awesome [changesets](https://github.com/changesets/changesets) library. The
style was inspired by the original
[@changesets/changelog-github](https://github.com/changesets/changesets/tree/main/packages/changelog-github) and the
[@svitejs/changesets-changelog-github-compact](https://github.com/svitejs/changesets-changelog-github-compact) packages.

## Installation

### With NPM

```sh
npm install -D @mheob/changeset-changelog
```

### With YARN

```sh
yarn add -D @mheob/changeset-changelog
```

### With PNPM

```sh
pnpm add -D @mheob/changeset-changelog
```

## Usage

Set in your `.changeset/config.json` file the following snippet:

```jsonc
"changelog": ["@mheob/changeset-changelog", { "repo": "YOUR_ORG_OR_USER/YOUR_REPO" }]
```

### Output

<!-- markdownlint-disable MD042 -->

There are differences between this changelog output and the others:

### `@changesets/changelog-github`

- [#PR-ID](#) [`commit`](#) Thanks [@user](#)! - Add nice feature to the project with a PR and commit
- [`commit`](#) Thanks [@user](#)! - Add nice feature to the project without a PR

### `@svitejs/changesets-changelog-github-compact`

- Add nice feature to the project with a PR and commit ([#PR](#))
- Add nice feature to the project without a PR ([commit](#))

<!-- markdownlint-disable MD024 -->

### `@mheob/changeset-changelog`

<!-- markdownlint-enable MD024 -->

- [PR](#) ([@user](#)): Add nice feature to the project with a PR and commit
- [commit](#) ([@user](#)): Add nice feature to the project without a PR

## Additional feature: linking issues

_Thanks to `@svitejs/changesets-changelog-github-compact` for this nice feature!_

All links to issues (or pull requests) in the chageset will automatically converted to a link.\
To enable the changeset have to called it like this variants:

- `(fix: #123)`,
- `(fixes: #123)`,
- `(resolves: #123)` or
- `(see: #123)`

### Example

The changeset

```yml
---
'@mheob/changeset-changelog': patch
---
Add nice feature to the project (see #123)
```

will outputted in the changelog like

> Add nice Feature to the project, (see [#123](#)) --> ([#130](#)) by [@user](#)
