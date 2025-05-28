import { describe, expect, it } from 'vitest';

import { errorMessage } from './utils';

describe('errorMessage', () => {
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
