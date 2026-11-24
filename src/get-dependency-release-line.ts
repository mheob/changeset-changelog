import { getCommitInfo } from '@changesets/get-github-info';
import type { GetDependencyReleaseLine, NewChangesetWithCommit } from '@changesets/types';

import { getRepository } from './utils';

export async function getDependencyReleaseLinks(
	changesets: readonly Readonly<Pick<NewChangesetWithCommit, 'commit'>>[],
	repository: string,
): Promise<string> {
	const commits = changesets.flatMap(({ commit }) =>
		commit === undefined || commit === '' ? [] : [commit],
	);
	const commitLinks = await Promise.all(
		commits.map(async (commit) => {
			// `undefined` when GitHub does not know the commit.
			const info = await getCommitInfo({ commit, repo: repository });
			return info?.commit.markdownLink;
		}),
	);

	return commitLinks.filter((link) => link !== undefined && link !== '').join(', ');
}

export const getDependencyReleaseLine: GetDependencyReleaseLine = async (
	changesets,
	dependenciesUpdated,
	options: Readonly<Record<string, unknown>> | null,
) => {
	const repository = getRepository(options);
	if (dependenciesUpdated.length === 0) return '';

	const links = await getDependencyReleaseLinks(changesets, repository);
	const headerMessage = `- Internal dependencies updated [${links}]:`;
	const updatedDependenciesList = dependenciesUpdated.map(
		(dependency) => `  - ${dependency.name}@${dependency.newVersion}`,
	);

	return [headerMessage, ...updatedDependenciesList].join('\n');
};
