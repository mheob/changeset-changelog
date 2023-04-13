const defaultConfig = require('@mheob/commitlint-config');

/** @type {import('cz-git').UserConfig} */
module.exports = {
	...defaultConfig,
	prompt: {
		...defaultConfig.prompt,
	},
};