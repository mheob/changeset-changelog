/* eslint-disable ts/no-explicit-any */
import { getInfo, getInfoFromPullRequest } from '@changesets/get-github-info';
import type { NewChangesetWithCommit } from '@changesets/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
	getGitHubLinks,
	getReleaseLine,
	getReplacedChangelog,
	getUserLink,
	linkifyIssue,
} from './get-release-line';

vi.mock('@changesets/get-github-info', () => ({
	getInfo: vi.fn(),
	getInfoFromPullRequest: vi.fn(),
}));

describe('getReplacedChangelog', () => {
	it('should extract commit, pr, users and replaced changelog', () => {
		const changeset: NewChangesetWithCommit = {
			commit: 'abc123',
			id: 'id',
			releases: [],
			summary: 'commit: abc123\npr: #42\nauthor: user1',
		};
		const result = getReplacedChangelog(changeset);
		expect(result.commitFromSummary).toBe('abc123');
		expect(result.prFromSummary).toBe(42);
		expect(result.usersFromSummary).toEqual(['user1']);
		expect(result.replacedChangelog).not.toContain('commit:');
		expect(result.replacedChangelog).not.toContain('pr:');
		expect(result.replacedChangelog).not.toContain('author:');
	});
});

describe('getGitHubLinks', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should use getInfoFromPullRequest if prFromSummary is present', async () => {
		(getInfoFromPullRequest as any).mockResolvedValue({
			links: { pull: 'pull-link', user: 'user-link' },
		});
		const result = await getGitHubLinks('repo', undefined, undefined, 123);
		expect(result.pull).toBe('pull-link');
		expect(result.user).toBe('user-link');
	});

	it('should use getInfo if commit is present', async () => {
		(getInfo as any).mockResolvedValue({
			links: { commit: 'commit-link', pull: 'pull-link', user: 'user-link' },
		});
		const result = await getGitHubLinks('repo', 'abc123');
		expect(result.commit).toBe('commit-link');
		expect(result.pull).toBe('pull-link');
		expect(result.user).toBe('user-link');
	});

	it('should return empty links if nothing is present', async () => {
		const result = await getGitHubLinks('repo');
		expect(result).toEqual({ commit: undefined, pull: undefined, user: undefined });
	});

	it('should use commitFromSummary if set and format commit link', async () => {
		(getInfoFromPullRequest as any).mockResolvedValue({
			links: { pull: 'pull-link', user: 'user-link' },
		});
		const result = await getGitHubLinks('org/repo', 'abc123', 'def456', 42);
		expect(result.pull).toBe('pull-link');
		expect(result.user).toBe('user-link');
		expect(result.commit).toBe('[`def456`](https://github.com/org/repo/commit/def456)');
	});
});

describe('getUserLink', () => {
	it('should return user links for usersFromSummary', () => {
		expect(getUserLink(['foo', 'bar'])).toBe(
			'([@foo](https://github.com/foo), [@bar](https://github.com/bar))',
		);
	});
	it('should return user if no usersFromSummary', () => {
		expect(getUserLink([], 'user-link')).toBe('(user-link)');
	});
	it('should return empty string if nothing is present', () => {
		expect(getUserLink([])).toBe('');
	});
});

describe('linkifyIssue', () => {
	it('should linkify issue references', () => {
		const repo = 'foo/bar';
		const input = '(fix #123)';
		const output = linkifyIssue(input, repo);
		expect(output).toContain('[#123](https://github.com/foo/bar/issues/123)');
	});
});

describe('getReleaseLine', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should throw if options.repo is missing', async () => {
		const changeset: NewChangesetWithCommit = {
			id: 'id',
			releases: [],
			summary: 'summary',
		};
		await expect(getReleaseLine(changeset, 'minor', {})).rejects.toThrow();
	});

	it('should return formatted release line with PR and user', async () => {
		(getInfoFromPullRequest as any).mockResolvedValue({
			links: {
				pull: '[#42](https://github.com/org/repo/pull/42)',
				user: '[@user1](https://github.com/user1)',
			},
		});
		const changeset: NewChangesetWithCommit = {
			commit: 'abc123',
			id: 'id',
			releases: [],
			summary: 'pr: #42\nauthor: user1\nA new feature.',
		};
		const result = await getReleaseLine(changeset, 'minor', { repo: 'org/repo' });
		expect(result).toContain('[#42](https://github.com/org/repo/pull/42)');
		expect(result).toContain('[@user1](https://github.com/user1)');
		expect(result).toContain('A new feature.');
	});

	it('should return formatted release line with commit if no PR', async () => {
		(getInfo as any).mockResolvedValue({
			links: { commit: '[`abc123`](https://github.com/org/repo/commit/abc123)' },
		});
		const changeset: NewChangesetWithCommit = {
			commit: 'abc123',
			id: 'id',
			releases: [],
			summary: 'commit: abc123\nA new feature.',
		};
		const result = await getReleaseLine(changeset, 'minor', { repo: 'org/repo' });
		expect(result).toContain('[`abc123`](https://github.com/org/repo/commit/abc123)');
		expect(result).toContain('A new feature.');
	});
});
