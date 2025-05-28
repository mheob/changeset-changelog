/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		coverage: {
			exclude: ['**/index.ts'],
			include: ['src/**/*.ts'],
			provider: 'v8',
		},
	},
});
