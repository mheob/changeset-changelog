import { getInfo, getInfoFromPullRequest } from '@changesets/get-github-info';
import type { NewChangesetWithCommit } from '@changesets/types';

export const errorMessage = `Please provide a repo to this changelog generator like this:
"changelog": ["@mheob/changeset-changelog", { "repo": "org/repo" }]`;

export async function getDependencyReleaseLinks(
	changesets: NewChangesetWithCommit[],
	repository: string,
): Promise<string> {
	const changesetLinks = await Promise.all(
		changesets.map(async (cs) => {
			if (!cs.commit) return;
			const { links } = await getInfo({ repo: repository, commit: cs.commit });
			return links.commit;
		}),
	);

	return changesetLinks.filter(Boolean).join(', ');
}

export function getReplacedChangelog(changeset: NewChangesetWithCommit): {
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
export async function getGitHubLinks(
	repository: string,
	commit?: string,
	commitFromSummary?: string,
	prFromSummary?: number,
): Promise<GithubLinks> {
	let githubLinks: GithubLinks = { commit: undefined, pull: undefined, user: undefined };

	if (prFromSummary) {
		const { links } = await getInfoFromPullRequest({ pull: prFromSummary, repo: repository });
		githubLinks = {
			...githubLinks,
			pull: links.pull,
			// istanbul ignore next: because of our mocked get-github-info
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
			// istanbul ignore next: because of our mocked get-github-info
			pull: links.pull ?? undefined,
			// istanbul ignore next: because of our mocked get-github-info
			user: links.user ?? undefined,
		};
	}

	return githubLinks;
}

export function getUserLink(usersFromSummary: string[], user?: string): string | undefined {
	const userLink =
		usersFromSummary.length > 0
			? usersFromSummary
					.map((userFromSummary) => `[@${userFromSummary}](https://github.com/${userFromSummary})`)
					.join(', ')
			: user;

	return userLink ? `by ${userLink}` : undefined;
}
