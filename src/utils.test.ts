import { describe, expect, it } from 'vite-plus/test';

import { errorMessage } from './utils';

describe('the error message', () => {
	it('should contain the correct instruction', () => {
		expect(errorMessage).toContain('Please provide a repo to this changelog generator');
	});

	it('should contain an example with repo', () => {
		expect(errorMessage).toContain('"repo": "org/repo"');
	});

	it('should start with the expected phrase', () => {
		expect(errorMessage.startsWith('Please provide a repo')).toBe(true);
	});
});
