import type { NewChangesetWithCommit } from '@changesets/types';
import { describe, expect, it, vi } from 'vitest';

import { getDependencyReleaseLine, getReleaseLine } from '.';
import { errorMessage } from './utils';

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

describe('getDependencyReleaseLine', () => {
	it('should throw an error if options.repo is missing', async () => {
		const changeset = getChangeset('An awesome feature.', data.commit);
		const result = getDependencyReleaseLine([changeset], [], {});
		await expect(result).rejects.toThrowError(errorMessage);
	});

	it('should return an empty string if no `dependenciesUpdated` is given', async () => {
		const changeset = getChangeset('An awesome feature.', data.commit);
		const result = await getDependencyReleaseLine([changeset], [], { repo: data.repo });
		expect(result).toBe('');
	});

	it('should return the changelog in a string format', async () => {
		const changeset1 = getChangeset('An first awesome feature.', data.commit);
		const changeset2 = getChangeset('An second awesome feature.', data.commit);
		const result = await getDependencyReleaseLine(
			[changeset1, changeset2],
			[
				{
					name: 'pkg',
					type: 'minor',
					oldVersion: '1.0.0',
					newVersion: '1.1.0',
					changesets: [changeset1.id, changeset2.id],
					packageJson: { name: 'pkg', version: '1.1.0' },
					dir: '',
				},
			],
			{
				repo: data.repo,
			},
		);
		expect(result).toBe(
			'- Internal dependencies updated [[`38f35f8`](https://github.com/mheob/changeset-changelog/commit/38f35f8), [`38f35f8`](https://github.com/mheob/changeset-changelog/commit/38f35f8)]:\n  - pkg@1.1.0',
		);
	});
});

describe('getReplacedChangelog', () => {
	it('should throw an error if options.repo is missing', async () => {
		const changeset = getChangeset('An awesome feature.', data.commit);
		const result = getReleaseLine(changeset, 'minor', {});
		await expect(result).rejects.toThrowError(errorMessage);
	});

	it('should return the changelog in a string format', async () => {
		const changeset = getChangeset(
			'An awesome feature.\npr: #2\ncommit: 38f35f8\nauthor: @mheob',
			data.commit,
		);
		const result = await getReleaseLine(changeset, 'minor', { repo: data.repo });
		expect(result).toBe(
			'\n- An awesome feature. ([[#2](https://github.com/mheob/changeset-changelog/pull/2)] [`38f35f8`](https://github.com/mheob/changeset-changelog/commit/38f35f8) by [@mheob](https://github.com/mheob))\n',
		);
	});

	it('should return the changelog in a string format but without meta data', async () => {
		const changeset = getChangeset('An awesome feature.', data.commit);
		const result = await getReleaseLine(changeset, 'minor', { repo: data.repo });
		expect(result).toBe(
			'\n- An awesome feature. ([[#2](https://github.com/mheob/changeset-changelog/pull/2)] [`38f35f8`](https://github.com/mheob/changeset-changelog/commit/38f35f8) by [@mheob](https://github.com/mheob))\n',
		);
	});

	it('should return the changelog in a string format but without meta data', async () => {
		const changeset = getChangeset('An awesome feature.');
		const result = await getReleaseLine(changeset, 'minor', { repo: data.repo });
		expect(result).toBe('\n- An awesome feature.\n');
	});
});
