import type { NewChangesetWithCommit } from '@changesets/types';
import { describe, expect, it, vi } from 'vitest';

import {
	getDependencyReleaseLinks,
	getGitHubLinks,
	getReplacedChangelog,
	getUserLink,
} from './utils';

export const data = {
	commit: '38f35f8',
	user: 'mheob',
	pull: 2,
	repo: 'mheob/changeset-changelog',
};

vi.mock('@changesets/get-github-info', (): unknown => {
	// this is duplicated because vi.mock reordering things
	const data = {
		commit: '38f35f8',
		user: 'mheob',
		pull: 2,
		repo: 'mheob/changeset-changelog',
	};

	const links = {
		user: `[@${data.user}](https://github.com/${data.user})`,
		pull: `[#${data.pull}](https://github.com/${data.repo}/pull/${data.pull})`,
		commit: `[\`${data.commit}\`](https://github.com/${data.repo}/commit/${data.commit})`,
	};

	return {
		async getInfo({ commit, repo }: { commit: string; repo: string }) {
			expect(commit).toBe(data.commit);
			expect(repo).toBe(data.repo);
			return {
				pull: data.pull,
				user: data.user,
				links,
			};
		},

		async getInfoFromPullRequest({ pull, repo }: { pull: number; repo: string }) {
			expect(pull).toBe(data.pull);
			expect(repo).toBe(data.repo);
			return {
				commit: data.commit,
				user: data.user,
				links,
			};
		},
	};
});

const getChangeset = (content: string, commit?: string): NewChangesetWithCommit => {
	return {
		id: 'some-id',
		commit: commit || '',
		summary: content,
		releases: [{ name: 'pkg', type: 'minor' }],
	};
};

describe('getReplacedChangelog', () => {
	it('should return the pr number', () => {
		const changeset = getChangeset(`pr: #${data.pull.toString()}`, data.commit);
		const result = getReplacedChangelog(changeset);
		expect(result.prFromSummary).toBe(2);
	});

	it('should return the author', () => {
		const changeset = getChangeset(`author: @${data.user}`, data.commit);
		const result = getReplacedChangelog(changeset);
		expect(result.usersFromSummary).toHaveLength(1);
		expect(result.usersFromSummary[0]).toBe('mheob');
	});
});

describe('getGitHubLinks', () => {
	it('should return the github links', async () => {
		const changeset = getChangeset('', data.commit);
		const result = await getGitHubLinks(data.repo, data.commit, changeset.commit, data.pull);
		expect(result.commit).toBe(
			'[`38f35f8`](https://github.com/mheob/changeset-changelog/commit/38f35f8)',
		);
		expect(result.pull).toBe('[#2](https://github.com/mheob/changeset-changelog/pull/2)');
		expect(result.user).toBe('[@mheob](https://github.com/mheob)');
	});

	it('should return the empty github links if no pr is given', async () => {
		const result = await getGitHubLinks(data.repo);
		expect(result.commit).toBeUndefined();
		expect(result.pull).toBeUndefined();
		expect(result.user).toBeUndefined();
	});
});

describe('getUserLink', () => {
	it('should return the user links on no giving user', () => {
		const userLink = '[@mheob](https://github.com/mheob)';
		const result = getUserLink([], userLink);
		expect(result).toBe(`by ${userLink}`);
	});

	it('should return the user links on one giving user', () => {
		const userLink = '[@mheob](https://github.com/mheob)';
		const result = getUserLink([data.user], `defect ${userLink}`);
		expect(result).toBe(`by ${userLink}`);
	});

	it('should return the user links on multiple giving user', () => {
		const userLink = '[@mheob](https://github.com/mheob), [@mheob](https://github.com/mheob)';
		const result = getUserLink([data.user, data.user], `defect ${userLink}`);
		expect(result).toBe(`by ${userLink}`);
	});
});

describe('getDependencyReleaseLinks', () => {
	it('should not return the dependency release links if no commit is given in the changelog', async () => {
		const changesets = [getChangeset('')];
		const result = await getDependencyReleaseLinks(changesets, data.repo);
		expect(result).toBe('');
	});

	it('should return the dependency release links for one given changesets', async () => {
		const changesets = [getChangeset('', data.commit)];
		const result = await getDependencyReleaseLinks(changesets, data.repo);
		expect(result).toBe('[`38f35f8`](https://github.com/mheob/changeset-changelog/commit/38f35f8)');
	});

	it('should return the dependency release links for two given changesets', async () => {
		const changesets = [getChangeset('', data.commit), getChangeset('', data.commit)];
		const result = await getDependencyReleaseLinks(changesets, data.repo);
		expect(result).toBe(
			'[`38f35f8`](https://github.com/mheob/changeset-changelog/commit/38f35f8), [`38f35f8`](https://github.com/mheob/changeset-changelog/commit/38f35f8)',
		);
	});
});
