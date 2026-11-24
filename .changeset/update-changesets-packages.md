---
'@mheob/changeset-changelog': patch
---

Update `@changesets/get-github-info` to v1 and `@changesets/types` to v7 (the types of Changesets v3). A commit or pull request that GitHub does not know no longer fails the changelog; its release line is written without that link.

Drop `dotenv`: `@changesets/get-github-info` now reads `GITHUB_TOKEN` (and `GITHUB_SERVER_URL`, `GITHUB_GRAPHQL_URL`) from the environment or from a `.env` file in the working directory itself. Other variables of the `.env` file are no longer loaded into `process.env`.
