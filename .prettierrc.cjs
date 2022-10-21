module.exports = {
	...require('@mheob/prettier-config'),

	overrides: [
		...require('@mheob/prettier-config').overrides,
		{
			files: '*.md',
			options: {
				printWidth: 999,
				proseWrap: 'never',
			},
		},
	],
};
