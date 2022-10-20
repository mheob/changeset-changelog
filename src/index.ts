import type {
	ChangelogFunctions,
	GetDependencyReleaseLine,
	GetReleaseLine,
} from '@changesets/types';
import { config } from 'dotenv';

import {
	errorMessage,
	getDependencyReleaseLinks,
	getGitHubLinks,
	getReplacedChangelog,
	getUserLink,
} from './utils';

config();

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

export const getReleaseLine: GetReleaseLine = async (changeset, _type, options) => {
	if (!options?.['repo']) throw new Error(errorMessage);

	const { commitFromSummary, prFromSummary, replacedChangelog, usersFromSummary } =
		getReplacedChangelog(changeset);
	const { commit, pull, user } = await getGitHubLinks(
		options['repo'],
		changeset.commit,
		commitFromSummary,
		prFromSummary,
	);
	const userLink = getUserLink(usersFromSummary, user);
	const [firstLine, ...futureLines] = replacedChangelog.split('\n').map((line) => line.trimEnd());

	const suffix = [pull ? `[${pull}]` : '', commit ?? '', userLink ?? ''].join(' ');
	const suffixedMessage = suffix.trim() ? ` (${suffix})` : '';
	const futureLinesMessage = futureLines.map((line) => `  ${line}`).join('\n');

	return `\n- ${firstLine}${suffixedMessage}\n${futureLinesMessage}`;
};

const changelogFunctions: ChangelogFunctions = {
	getDependencyReleaseLine,
	getReleaseLine,
};

export default changelogFunctions;
