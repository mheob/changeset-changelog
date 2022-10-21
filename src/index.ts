import type { ChangelogFunctions } from '@changesets/types';
import { config } from 'dotenv';

import { getDependencyReleaseLine } from './getDependencyReleaseLine';
import { getReleaseLine } from './getReleaseLine';

config();

const changelogFunctions: ChangelogFunctions = {
	getDependencyReleaseLine,
	getReleaseLine,
};

export default changelogFunctions;
