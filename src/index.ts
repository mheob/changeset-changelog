import type { ChangelogFunctions } from '@changesets/types';

import { getDependencyReleaseLine } from './get-dependency-release-line';
import { getReleaseLine } from './get-release-line';

// GITHUB_TOKEN comes from the environment or from a `.env` file in the working directory; both
// are read by @changesets/get-github-info.
const changelogFunctions: ChangelogFunctions = {
	getDependencyReleaseLine,
	getReleaseLine,
};

export default changelogFunctions;
