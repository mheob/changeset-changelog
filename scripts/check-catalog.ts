// Checks that package.json takes every external version from the pnpm catalog (pnpm-workspace.yaml).
// Prints one line per violation and exits with code 1. Run it after touching dependencies:
// `pnpm check:catalog`.

import { readFile } from 'node:fs/promises';

type JsonObject = Readonly<Record<string, unknown>>;

const DEPENDENCY_FIELDS = [
	'dependencies',
	'devDependencies',
	'peerDependencies',
	'optionalDependencies',
] as const;

/** `catalog:` or a named catalog like `catalog:react`. */
const ALLOWED_SPEC = /^catalog:[\w.-]*$/u;

function isJsonObject(value: unknown): value is JsonObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Lists the dependencies whose version does not come from the catalog.
 *
 * @param packageJson The parsed package.json.
 * @returns One `<field>: <dependency> = <spec>` line per violation.
 */
function findViolations(packageJson: JsonObject): string[] {
	return DEPENDENCY_FIELDS.flatMap((field) => {
		const dependencies = packageJson[field];
		if (!isJsonObject(dependencies)) return [];

		return Object.entries(dependencies)
			.filter(
				([, spec]: readonly [string, unknown]) =>
					typeof spec !== 'string' || !ALLOWED_SPEC.test(spec),
			)
			.map(([name, spec]: readonly [string, unknown]) => `${field}: ${name} = ${String(spec)}`);
	});
}

const json: unknown = JSON.parse(
	await readFile(new URL('../package.json', import.meta.url), 'utf8'),
);
if (!isJsonObject(json)) throw new TypeError('package.json is not a JSON object.');

const violations = findViolations(json);
if (violations.length > 0) {
	console.error(
		[
			...violations,
			'Move these versions into the catalog of pnpm-workspace.yaml and use "catalog:" in package.json.',
		].join('\n'),
	);
	process.exitCode = 1;
}
