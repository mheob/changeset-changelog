import process from 'node:process';

import installHusky from 'husky';

const isCI = process.env.CI !== undefined;

if (!isCI) {
	console.log(installHusky());
}
