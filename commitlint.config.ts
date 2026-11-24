import defaultConfig from '@mheob/commitlint-config';

export default {
	...defaultConfig,
	prompt: {
		...defaultConfig.prompt,
		allowEmptyScopes: true,
	},
};
