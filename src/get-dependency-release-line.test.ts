import { getCommitInfo } from '@changesets/get-github-info';
import type { CommitInfo } from '@changesets/get-github-info';
import type { ModCompWithPackage, NewChangesetWithCommit } from '@changesets/types';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { getDependencyReleaseLine, getDependencyReleaseLinks } from './get-dependency-release-line';

vi.mock(import('@changesets/get-github-info'), () => ({
	getCommitInfo: vi.fn(),
}));

function commitInfo(sha: string): CommitInfo {
	const url = `https://github.com/org/repo/commit/${sha}`;
	return { commit: { markdownLink: url, sha, url } };
}

describe(getDependencyReleaseLinks, () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should return commit links for each changeset', async () => {
		vi.mocked(getCommitInfo)
			.mockResolvedValueOnce(commitInfo('abc123'))
			.mockResolvedValueOnce(commitInfo('def456'));
		const changesets: NewChangesetWithCommit[] = [
			{ commit: 'abc123', id: 'cs1', releases: [], summary: '' },
			{ commit: 'def456', id: 'cs2', releases: [], summary: '' },
		];
		const result = await getDependencyReleaseLinks(changesets, 'org/repo');

		expect(result).toBe(
			'https://github.com/org/repo/commit/abc123, https://github.com/org/repo/commit/def456',
		);
	});

	it('should skip changesets without commit', async () => {
		vi.mocked(getCommitInfo).mockResolvedValueOnce(commitInfo('def456'));
		const changesets: NewChangesetWithCommit[] = [
			{ id: 'cs1', releases: [], summary: '' },
			{ commit: '', id: 'cs2', releases: [], summary: '' },
			{ commit: 'def456', id: 'cs3', releases: [], summary: '' },
		];
		const result = await getDependencyReleaseLinks(changesets, 'org/repo');

		expect(result).toBe('https://github.com/org/repo/commit/def456');
		expect(getCommitInfo).toHaveBeenCalledExactlyOnceWith({ commit: 'def456', repo: 'org/repo' });
	});

	it('should skip commits GitHub does not know', async () => {
		vi.mocked(getCommitInfo)
			.mockResolvedValueOnce(undefined)
			.mockResolvedValueOnce(commitInfo('def456'));
		const changesets: NewChangesetWithCommit[] = [
			{ commit: 'abc123', id: 'cs1', releases: [], summary: '' },
			{ commit: 'def456', id: 'cs2', releases: [], summary: '' },
		];
		const result = await getDependencyReleaseLinks(changesets, 'org/repo');

		expect(result).toBe('https://github.com/org/repo/commit/def456');
	});
});

describe(getDependencyReleaseLine, () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should throw if options.repo is missing', async () => {
		await expect(getDependencyReleaseLine([], [], {})).rejects.toThrow(
			'Please provide a repo to this changelog generator',
		);
	});

	it('should return empty string if no dependencies updated', async () => {
		const result = await getDependencyReleaseLine([], [], { repo: 'org/repo' });

		expect(result).toBe('');
	});

	it('should return formatted release line with links and dependencies', async () => {
		vi.mocked(getCommitInfo).mockResolvedValueOnce(commitInfo('abc123'));
		const changesets: NewChangesetWithCommit[] = [
			{ commit: 'abc123', id: 'cs1', releases: [], summary: '' },
		];
		const dependenciesUpdated: ModCompWithPackage[] = [
			{
				changesets: ['cs1'],
				dir: '',
				name: 'foo',
				newVersion: '1.2.3',
				oldVersion: '1.2.2',
				packageJson: { name: 'foo', version: '1.2.3' },
				type: 'minor',
			},
			{
				changesets: ['cs1'],
				dir: '',
				name: 'bar',
				newVersion: '2.0.0',
				oldVersion: '1.9.9',
				packageJson: { name: 'bar', version: '2.0.0' },
				type: 'major',
			},
		];
		const result = await getDependencyReleaseLine(changesets, dependenciesUpdated, {
			repo: 'org/repo',
		});

		expect(result).toBe(
			'- Internal dependencies updated [https://github.com/org/repo/commit/abc123]:\n  - foo@1.2.3\n  - bar@2.0.0',
		);
	});
});
