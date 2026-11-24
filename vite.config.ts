import { baseConfig as fmtBaseConfig } from '@mheob/oxfmt-config';
import { baseConfig, baseJsConfig } from '@mheob/oxlint-config';
import { defineConfig } from 'vite-plus';

export default defineConfig({
	fmt: {
		...fmtBaseConfig,
		// Changesets writes the changelog.
		ignorePatterns: ['CHANGELOG.md'],
	},
	lint: {
		extends: [baseConfig, baseJsConfig],
		ignorePatterns: ['coverage/**', 'dist/**'],
		jsPlugins: [{ name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' }],
		options: { typeAware: true, typeCheck: true },
		rules: {
			// Parameters typed by a library (changesets' `GetReleaseLine`, array callbacks) cannot be made
			// readonly here, so only the types written in this repository are checked.
			'typescript/prefer-readonly-parameter-types': ['warn', { ignoreInferredTypes: true }],
			// A signature may require `undefined` as an argument, e.g. `mockResolvedValue(undefined)`.
			'unicorn/no-useless-undefined': ['warn', { checkArguments: false }],
			'vite-plus/prefer-vite-plus-imports': 'error',
		},
	},
	// The published package: ESM (`dist/index.mjs`) and CommonJS (`dist/index.cjs`). Changesets loads a
	// changelog generator with `require()`, so the CommonJS build must stay.
	pack: {
		clean: true,
		entry: ['src/index.ts'],
		fixedExtension: true,
		format: ['esm', 'cjs'],
	},
	staged: {
		'*': 'vp check --fix',
		'package.json': 'pnpm check:catalog',
	},
	test: {
		// Uploaded to Codecov from `coverage/lcov.info` (see `.github/workflows/check.yml`).
		coverage: {
			exclude: ['src/index.ts', 'src/**/*.test.ts'],
			include: ['src/**/*.ts'],
			provider: 'v8',
			reporter: ['text', 'lcov'],
			reportsDirectory: 'coverage',
		},
	},
});
