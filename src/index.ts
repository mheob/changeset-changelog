import type {
	ChangelogFunctions,
	GetDependencyReleaseLine,
	GetReleaseLine,
} from '@changesets/types';

import {
	errorMessage,
	getDependencyReleaseLinks,
	getGitHubLinks,
	getReplacedChangelog,
	getUserLink,
} from './utils';

const getReleaseLine: GetReleaseLine = async (changeset, _type, options) => {
	if (!options?.['repo']) throw new Error(errorMessage);

	const { prFromSummary, replacedChangelog, usersFromSummary } = getReplacedChangelog(changeset);
	const { pull, user } = await getGitHubLinks(options['repo'], prFromSummary);
	const userLink = getUserLink(usersFromSummary, user);
	const [firstLine, ...futureLines] = replacedChangelog.split('\n').map((line) => line.trimEnd());

	const suffix = [pull ? ` [${pull}]` : '', userLink ? ` - Thanks ${userLink}!` : ''].join('');
	const suffixedMessage = suffix ? ` (${suffix})` : '';
	const futureLinesMessage = futureLines.map((line) => `  ${line}`).join('\n');

	return `\n- ${firstLine}${suffixedMessage}\n${futureLinesMessage}`;
};

const getDependencyReleaseLine: GetDependencyReleaseLine = async (
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

const changelogFunctions: ChangelogFunctions = {
	getDependencyReleaseLine,
	getReleaseLine,
};

export default changelogFunctions;
