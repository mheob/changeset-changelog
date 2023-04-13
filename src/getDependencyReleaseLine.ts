import { getInfo } from '@changesets/get-github-info';
import type { GetDependencyReleaseLine, NewChangesetWithCommit } from '@changesets/types';

import { errorMessage } from './utils';

async function getDependencyReleaseLinks(changesets: NewChangesetWithCommit[], repository: string) {
	const changesetLinks = await Promise.all(
		changesets.map(async (cs) => {
			// istanbul ignore next: because of our mocked get-github-info -- @preserve
			if (!cs.commit) return;
			const { links } = await getInfo({ repo: repository, commit: cs.commit });
			return links.commit;
		}),
	);

	return changesetLinks.filter(Boolean).join(', ');
}

export const getDependencyReleaseLine: GetDependencyReleaseLine = async (
	changesets,
	dependenciesUpdated,
	options,
) => {
	if (!options?.['repo']) throw new Error(errorMessage);
	if (dependenciesUpdated.length === 0) return '';

	const links = await getDependencyReleaseLinks(changesets, options['repo']);
	const headerMessage = `- Internal dependencies updated [${links}]:`;
	const updatedDependenciesList = dependenciesUpdated.map(
		(dependency) => `  - ${dependency.name}@${dependency.newVersion}`,
	);

	return [headerMessage, ...updatedDependenciesList].join('\n');
};
