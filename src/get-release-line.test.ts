import { getCommitInfo, getPullRequestInfo } from '@changesets/get-github-info';
import type { CommitInfo, PullRequestInfo } from '@changesets/get-github-info';
import type { NewChangesetWithCommit } from '@changesets/types';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import {
	getGitHubLinks,
	getReleaseLine,
	getReplacedChangelog,
	getUserLink,
	linkifyIssue,
} from './get-release-line';

vi.mock(import('@changesets/get-github-info'), () => ({
	getCommitInfo: vi.fn(),
	getPullRequestInfo: vi.fn(),
}));

const author: NonNullable<CommitInfo['author']> = {
	login: 'user1',
	markdownLink: '[@user1](https://github.com/user1)',
	url: 'https://github.com/user1',
};
const commit: CommitInfo['commit'] = {
	markdownLink: '[`abc123`](https://github.com/org/repo/commit/abc123)',
	sha: 'abc123',
	url: 'https://github.com/org/repo/commit/abc123',
};
const pull: PullRequestInfo['pull'] = {
	markdownLink: '[#42](https://github.com/org/repo/pull/42)',
	number: 42,
	url: 'https://github.com/org/repo/pull/42',
};

describe(getReplacedChangelog, () => {
	it('should extract commit, pr, users and replaced changelog', () => {
		const changeset: NewChangesetWithCommit = {
			commit: 'abc123',
			id: 'id',
			releases: [],
			summary: 'commit: abc123\npr: #42\nauthor: user1',
		};

		expect(getReplacedChangelog(changeset)).toStrictEqual({
			commitFromSummary: 'abc123',
			prFromSummary: 42,
			replacedChangelog: '',
			usersFromSummary: ['user1'],
		});
	});
});

describe(getGitHubLinks, () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should use getPullRequestInfo if prFromSummary is present', async () => {
		vi.mocked(getPullRequestInfo).mockResolvedValue({ author, pull });
		const result = await getGitHubLinks({ prFromSummary: 42, repository: 'org/repo' });

		expect(result).toStrictEqual({
			commit: undefined,
			pull: pull.markdownLink,
			user: author.markdownLink,
		});
	});

	it('should use getCommitInfo if commit is present', async () => {
		vi.mocked(getCommitInfo).mockResolvedValue({ author, commit, pull });
		const result = await getGitHubLinks({ commit: 'abc123', repository: 'org/repo' });

		expect(result).toStrictEqual({
			commit: commit.markdownLink,
			pull: pull.markdownLink,
			user: author.markdownLink,
		});
	});

	it('should return empty links if nothing is present', async () => {
		const result = await getGitHubLinks({ repository: 'org/repo' });

		expect(result).toStrictEqual({ commit: undefined, pull: undefined, user: undefined });
	});

	it('should return empty links if GitHub does not know the commit', async () => {
		vi.mocked(getCommitInfo).mockResolvedValue(undefined);
		const result = await getGitHubLinks({ commit: 'abc123', repository: 'org/repo' });

		expect(result).toStrictEqual({ commit: undefined, pull: undefined, user: undefined });
	});

	it('should ignore pull request #0', async () => {
		const result = await getGitHubLinks({ prFromSummary: 0, repository: 'org/repo' });

		expect(getPullRequestInfo).not.toHaveBeenCalled();
		expect(result).toStrictEqual({ commit: undefined, pull: undefined, user: undefined });
	});

	it('should prefer commitFromSummary over the commit of the changeset', async () => {
		vi.mocked(getCommitInfo).mockResolvedValue({ commit });
		const result = await getGitHubLinks({
			commit: 'abc123',
			commitFromSummary: 'def456',
			repository: 'org/repo',
		});

		expect(getCommitInfo).toHaveBeenCalledExactlyOnceWith({ commit: 'def456', repo: 'org/repo' });
		expect(result).toStrictEqual({ commit: commit.markdownLink, pull: undefined, user: undefined });
	});

	it('should use commitFromSummary if set and format commit link', async () => {
		vi.mocked(getPullRequestInfo).mockResolvedValue({ author, pull });
		const result = await getGitHubLinks({
			commit: 'abc123',
			commitFromSummary: 'def456',
			prFromSummary: 42,
			repository: 'org/repo',
		});

		expect(result).toStrictEqual({
			commit: '[`def456`](https://github.com/org/repo/commit/def456)',
			pull: pull.markdownLink,
			user: author.markdownLink,
		});
	});

	it('should keep the commit link if GitHub does not know the pull request', async () => {
		vi.mocked(getPullRequestInfo).mockResolvedValue(undefined);
		const result = await getGitHubLinks({
			commitFromSummary: 'def456',
			prFromSummary: 42,
			repository: 'org/repo',
		});

		expect(result).toStrictEqual({
			commit: '[`def456`](https://github.com/org/repo/commit/def456)',
			pull: undefined,
			user: undefined,
		});
	});
});

describe(getUserLink, () => {
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

	it('should return empty string for an empty user', () => {
		expect(getUserLink([], '')).toBe('');
	});
});

describe(linkifyIssue, () => {
	it('should linkify issue references', () => {
		const output = linkifyIssue('(fix #123)', 'foo/bar');

		expect(output).toContain('[#123](https://github.com/foo/bar/issues/123)');
	});
});

describe(getReleaseLine, () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should throw if options.repo is missing', async () => {
		const changeset: NewChangesetWithCommit = {
			id: 'id',
			releases: [],
			summary: 'summary',
		};

		await expect(getReleaseLine(changeset, 'minor', {})).rejects.toThrow(
			'Please provide a repo to this changelog generator',
		);
	});

	it('should return formatted release line with PR and user', async () => {
		vi.mocked(getPullRequestInfo).mockResolvedValue({ author, pull });
		const changeset: NewChangesetWithCommit = {
			commit: 'abc123',
			id: 'id',
			releases: [],
			summary: 'pr: #42\nauthor: user1\nA new feature.',
		};
		const result = await getReleaseLine(changeset, 'minor', { repo: 'org/repo' });

		expect(result).toBe(
			'\n\n- [#42](https://github.com/org/repo/pull/42) ([@user1](https://github.com/user1)): A new feature.\n',
		);
	});

	it('should return formatted release line with commit if no PR', async () => {
		vi.mocked(getCommitInfo).mockResolvedValue({ commit });
		const changeset: NewChangesetWithCommit = {
			commit: 'abc123',
			id: 'id',
			releases: [],
			summary: 'commit: abc123\nA new feature.',
		};
		const result = await getReleaseLine(changeset, 'minor', { repo: 'org/repo' });

		expect(result).toBe(
			'\n\n- [`abc123`](https://github.com/org/repo/commit/abc123) : A new feature.\n',
		);
	});

	it('should return the release line without link if there is neither PR nor commit', async () => {
		const changeset: NewChangesetWithCommit = { id: 'id', releases: [], summary: 'A fix.' };
		const result = await getReleaseLine(changeset, 'patch', { repo: 'org/repo' });

		expect(result).toBe('\n\n-  : A fix.\n');
	});
});
