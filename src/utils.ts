import { getInfo, getInfoFromPullRequest } from '@changesets/get-github-info';
import type { NewChangesetWithCommit } from '@changesets/types';

export const errorMessage = `Please provide a repo to this changelog generator like this:
"changelog": ["@mheob/changeset-changelog", { "repo": "org/repo" }]`;

export function getReplacedChangelog(changeset: NewChangesetWithCommit): {
	prFromSummary: number | undefined;
	usersFromSummary: string[];
	replacedChangelog: string;
} {
	let prFromSummary: number | undefined;
	const usersFromSummary: string[] = [];

	const replacedChangelog = changeset.summary
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
		prFromSummary,
		usersFromSummary,
		replacedChangelog,
	};
}

export async function getGitHubLinks(
	repository: string,
	prFromSummary?: number,
): Promise<{ pull: string; user: string | null }> {
	if (prFromSummary) {
		const { links } = await getInfoFromPullRequest({ pull: prFromSummary, repo: repository });
		return {
			pull: links.pull,
			user: links.user,
		};
	}

	return { pull: '', user: null };
}

type UserLink = string | null;

export function getUserLink(usersFromSummary: string[], user: UserLink): UserLink {
	return usersFromSummary.length > 0
		? usersFromSummary
				.map((userFromSummary) => `[@${userFromSummary}](https://github.com/${userFromSummary})`)
				.join(', ')
		: user;
}

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
