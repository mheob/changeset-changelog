import { getInfo, getInfoFromPullRequest } from '@changesets/get-github-info';
import type { GetReleaseLine, NewChangesetWithCommit } from '@changesets/types';

import { errorMessage } from './utils';

function getReplacedChangelog(changeset: NewChangesetWithCommit): {
	commitFromSummary: string | undefined;
	prFromSummary: number | undefined;
	replacedChangelog: string;
	usersFromSummary: string[];
} {
	let prFromSummary: number | undefined;
	let commitFromSummary: string | undefined;
	const usersFromSummary: string[] = [];

	const replacedChangelog = changeset.summary
		.replace(/^\s*commit:\s*(\S+)/im, (_, commit) => {
			commitFromSummary = commit;
			return '';
		})
		.replace(/^\s*(?:pr|pull|pull\s+request):\s*#?(\d+)/im, (_, pr) => {
			const prNumber = Number(pr);
			if (!Number.isNaN(prNumber)) prFromSummary = prNumber;
			return '';
		})
		.replace(/^\s*(?:author|user):\s*@?(\S+)/gim, (_, user) => {
			usersFromSummary.push(user);
			return '';
		})
		.trim();

	return {
		commitFromSummary,
		prFromSummary,
		replacedChangelog,
		usersFromSummary,
	};
}

type MaybeString = string | undefined;
type GithubLinks = { commit: MaybeString; pull: MaybeString; user: MaybeString };
async function getGitHubLinks(
	repository: string,
	commit?: string,
	commitFromSummary?: string,
	prFromSummary?: number,
) {
	let githubLinks: GithubLinks = { commit: undefined, pull: undefined, user: undefined };

	if (prFromSummary) {
		const { links } = await getInfoFromPullRequest({ pull: prFromSummary, repo: repository });
		githubLinks = {
			...githubLinks,
			pull: links.pull,
			// istanbul ignore next: because of our mocked get-github-info -- @preserve
			user: links.user ?? undefined,
		};

		if (commitFromSummary) {
			githubLinks = {
				...githubLinks,
				commit: `[\`${commitFromSummary}\`](https://github.com/${repository}/commit/${commitFromSummary})`,
			};
		}

		return githubLinks;
	}

	const commitToFetchFrom = commitFromSummary || commit;

	if (commitToFetchFrom) {
		const { links } = await getInfo({ repo: repository, commit: commitToFetchFrom });
		return {
			commit: links.commit,
			// istanbul ignore next: because of our mocked get-github-info -- @preserve
			pull: links.pull ?? undefined,
			// istanbul ignore next: because of our mocked get-github-info -- @preserve
			user: links.user ?? undefined,
		};
	}

	return githubLinks;
}

function getUserLink(usersFromSummary: string[], user?: string) {
	const userLink =
		usersFromSummary.length > 0
			? usersFromSummary
					.map((userFromSummary) => `[@${userFromSummary}](https://github.com/${userFromSummary})`)
					.join(', ')
					.trim()
			: user;

	return userLink ? `by ${userLink}` : undefined;
}

// add links to issue hints (fix #123) => (fix [#123](https://....))
// thanks to https://github.com/svitejs/changesets-changelog-github-compact
function linkifyIssue(line: string, repository: string) {
	return line.replace(/(?<=\( ?(?:fix|fixes|resolves|see) )(#\d+)(?= ?\))/g, (issue) => {
		return `[${issue}](https://github.com/${repository}/issues/${issue.slice(1)})`;
	});
}

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
	const [firstLine, ...futureLines] = replacedChangelog
		.split('\n')
		.map((line) => linkifyIssue(line.trimEnd(), options['repo']));

	const prMessage = pull ? `(${pull})` : '';
	const commitMessage = commit ? `(${commit})` : '';
	const userLinkMessage = userLink ?? '';
	// istanbul ignore next: because of our mocked get-github-info -- @preserve
	const printPrOrCommit = pull !== '' ? prMessage : commitMessage;
	const suffix = printPrOrCommit.trim() ? ` --> ${printPrOrCommit.trim()} ${userLinkMessage}` : '';

	const futureLinesMessage = futureLines.map((line) => `  ${line}`).join('\n');

	return `\n\n- ${firstLine}${suffix}\n${futureLinesMessage}`;
};
