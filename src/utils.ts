export const errorMessage = `Please provide a repo to this changelog generator like this:
"changelog": ["@mheob/changeset-changelog", { "repo": "org/repo" }]`;

/**
 * Reads the repository (`org/repo`) from the options of the changelog generator.
 *
 * @param options The options from `.changeset/config.json`.
 * @returns The repository.
 * @throws {Error} When the options name no repository.
 */
export function getRepository(options: Readonly<Record<string, unknown>> | null): string {
	const repository = options?.['repo'];
	if (typeof repository !== 'string' || repository === '') throw new Error(errorMessage);
	return repository;
}
