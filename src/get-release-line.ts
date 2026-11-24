import { getCommitInfo, getPullRequestInfo } from '@changesets/get-github-info';
import type { GetReleaseLine, NewChangesetWithCommit } from '@changesets/types';

import { getRepository } from './utils';

const COMMIT_PATTERN = /^\s*commit:\s*(?<commit>\S+)/imu;
const PULL_REQUEST_PATTERN = /^\s*(?:pr|pull|pull\s+request):\s*#?(?<pr>\d+)/imu;
const USER_PATTERN = /^\s*(?:author|user):\s*@?(?<user>\S+)/gimu;
const ISSUE_PATTERN = /(?<=\( ?(?:fix|fixes|resolves|see) )(?<issue>#\d+)(?= ?\))/gu;

interface ReplacedChangelog {
	commitFromSummary: string | undefined;
	prFromSummary: number | undefined;
	replacedChangelog: string;
	usersFromSummary: string[];
}

type MaybeString = string | undefined;
interface GithubLinks {
	commit: MaybeString;
	pull: MaybeString;
	user: MaybeString;
}

interface GitHubLinksRequest {
	commit?: MaybeString;
	commitFromSummary?: MaybeString;
	prFromSummary?: number | undefined;
	repository: string;
}

/**
 * Treats an empty string like a missing one.
 *
 * @param value The string.
 * @returns The string, or `undefined` when it is missing or empty.
 */
function nonEmpty(value: MaybeString): MaybeString {
	return value === '' ? undefined : value;
}

/**
 * The link that leads a release line: the pull request's, else the commit's.
 *
 * @param pull The link to the pull request.
 * @param commit The link to the commit.
 * @returns The link, or an empty string when there is neither.
 */
function getPrOrCommitLink(pull: MaybeString, commit: MaybeString): string {
	return (nonEmpty(pull) ?? commit ?? '').trim();
}

export function getReplacedChangelog(
	changeset: Readonly<Pick<NewChangesetWithCommit, 'summary'>>,
): ReplacedChangelog {
	const commitMatch = COMMIT_PATTERN.exec(changeset.summary);
	const withoutCommit = changeset.summary.replace(COMMIT_PATTERN, '');
	const pullRequestMatch = PULL_REQUEST_PATTERN.exec(withoutCommit);
	const withoutPullRequest = withoutCommit.replace(PULL_REQUEST_PATTERN, '');
	const pullRequest = pullRequestMatch?.groups?.['pr'];

	return {
		commitFromSummary: commitMatch?.groups?.['commit'],
		prFromSummary: pullRequest === undefined ? pullRequest : Number(pullRequest),
		replacedChangelog: withoutPullRequest.replaceAll(USER_PATTERN, '').trim(),
		usersFromSummary: [...withoutPullRequest.matchAll(USER_PATTERN)]
			.map((match) => match.groups?.['user'])
			.filter((user) => user !== undefined),
	};
}

export async function getGitHubLinks({
	commit,
	commitFromSummary,
	prFromSummary,
	repository,
}: Readonly<GitHubLinksRequest>): Promise<GithubLinks> {
	if (prFromSummary !== undefined && prFromSummary !== 0) {
		// `undefined` when GitHub does not know the pull request.
		const info = await getPullRequestInfo({ pull: prFromSummary, repo: repository });
		const summaryCommit = nonEmpty(commitFromSummary);

		return {
			commit:
				summaryCommit === undefined
					? summaryCommit
					: `[\`${summaryCommit}\`](https://github.com/${repository}/commit/${summaryCommit})`,
			pull: info?.pull.markdownLink,
			user: info?.author?.markdownLink,
		};
	}

	const commitToFetchFrom = nonEmpty(commitFromSummary) ?? nonEmpty(commit);
	if (commitToFetchFrom === undefined)
		return { commit: undefined, pull: undefined, user: undefined };

	// `undefined` when GitHub does not know the commit.
	const info = await getCommitInfo({ commit: commitToFetchFrom, repo: repository });
	return {
		commit: info?.commit.markdownLink,
		pull: info?.pull?.markdownLink,
		user: info?.author?.markdownLink,
	};
}

export function getUserLink(usersFromSummary: readonly string[], user?: string): string {
	const userLink =
		usersFromSummary.length > 0
			? usersFromSummary
					.map((userFromSummary) => `[@${userFromSummary}](https://github.com/${userFromSummary})`)
					.join(', ')
					.trim()
			: nonEmpty(user);

	return userLink === undefined ? '' : `(${userLink})`;
}

// add links to issue hints (fix #123) => (fix [#123](https://....))
// thanks to https://github.com/svitejs/changesets-changelog-github-compact
export function linkifyIssue(line: string, repository: string): string {
	return line.replaceAll(
		ISSUE_PATTERN,
		(issue) => `[${issue}](https://github.com/${repository}/issues/${issue.slice(1)})`,
	);
}

export const getReleaseLine: GetReleaseLine = async (
	changeset,
	_type,
	options: Readonly<Record<string, unknown>> | null,
) => {
	const repository = getRepository(options);
	const { commitFromSummary, prFromSummary, replacedChangelog, usersFromSummary } =
		getReplacedChangelog(changeset);
	const { commit, pull, user } = await getGitHubLinks({
		commit: changeset.commit,
		commitFromSummary,
		prFromSummary,
		repository,
	});
	const prefix = `${getPrOrCommitLink(pull, commit)} ${getUserLink(usersFromSummary, user)}: `;
	const [firstLine = '', ...futureLines] = replacedChangelog
		.split('\n')
		.map((line) => linkifyIssue(line.trimEnd(), repository));
	const futureLinesMessage = futureLines.map((line) => `  ${line}`).join('\n');

	return `\n\n- ${prefix}${firstLine}\n${futureLinesMessage}`;
};
