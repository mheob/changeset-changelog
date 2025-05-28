import defaultConfig from '@mheob/commitlint-config';

/** @type {import('cz-git').UserConfig} */
export default {
	...defaultConfig,
	prompt: {
		...defaultConfig.prompt,
		allowEmptyScopes: true,
	},
};
