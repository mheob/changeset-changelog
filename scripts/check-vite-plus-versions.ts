// Checks that the installed toolchain is the one `vite-plus` was released with. `vite-plus` pins
// `vite` (an `npm:` alias of its core package) and `vitest` to exact versions in its package.json;
// `@vitest/coverage-v8` must match `vitest`. The `vite@*` and `vitest@*` overrides in
// pnpm-workspace.yaml force the catalog's versions onto those pins, so a catalog entry that drifts
// from them installs without an error. This script compares what is installed with what
// `vite-plus` declares and exits with code 1 on a mismatch. Run it after `pnpm install`:
// `pnpm check:vite-plus`.

import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

type JsonObject = Readonly<Record<string, unknown>>;

interface PackageId {
	readonly name: string;
	readonly version: string;
}

/** A package that must be installed at the version `vite-plus` declares for it. */
interface Expectation {
	/** Who resolves the package, for the report. */
	readonly from: string;
	/** The `package.json` it is resolved from. */
	readonly fromManifest: string;
	/** The name it is imported by. */
	readonly specifier: string;
	readonly expected: PackageId;
}

function isJsonObject(value: unknown): value is JsonObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Reads a package.json.
 *
 * @param path The absolute path of the file.
 * @returns The parsed file.
 */
async function readManifest(path: string): Promise<JsonObject> {
	const json: unknown = JSON.parse(await readFile(path, 'utf8'));
	if (!isJsonObject(json)) throw new TypeError(`${path} is not a JSON object.`);
	return json;
}

/**
 * Resolves a package the way `import` does from the given package and reads its name and version.
 *
 * @param fromManifest The package.json of the importing package.
 * @param specifier The name the package is imported by.
 * @returns The path of the resolved package.json and the package's name and version.
 */
async function resolveInstalled(
	fromManifest: string,
	specifier: string,
): Promise<{ path: string; id: PackageId }> {
	const path = createRequire(fromManifest).resolve(`${specifier}/package.json`);
	const { name, version } = await readManifest(path);
	if (typeof name !== 'string' || typeof version !== 'string') {
		throw new TypeError(`${path} has no name and version.`);
	}
	return { id: { name, version }, path };
}

/**
 * What `vite-plus` declares for one of its dependencies: an exact version, or for `vite` an alias
 * `npm:<name>@<version>`.
 *
 * @param vitePlus The package.json of `vite-plus`.
 * @param dependency The dependency's name.
 * @returns The package name and version it must be installed as.
 */
function declaredDependency(vitePlus: JsonObject, dependency: string): PackageId {
	const { dependencies } = vitePlus;
	const spec = isJsonObject(dependencies) ? dependencies[dependency] : undefined;
	if (typeof spec !== 'string') {
		throw new TypeError(`vite-plus declares no dependencies.${dependency} to check against.`);
	}
	const alias = /^npm:(?<name>@?[^@]+)@(?<version>.+)$/u.exec(spec)?.groups;
	if (alias?.['name'] !== undefined && alias['version'] !== undefined) {
		return { name: alias['name'], version: alias['version'] };
	}
	return { name: dependency, version: spec };
}

/**
 * Describes a package as `name@version`.
 *
 * @param id The package.
 * @returns The description.
 */
function label(id: PackageId): string {
	return `${id.name}@${id.version}`;
}

const rootManifest = fileURLToPath(new URL('../package.json', import.meta.url));
const vitePlus = await resolveInstalled(rootManifest, 'vite-plus');
const vitePlusManifest = await readManifest(vitePlus.path);
const vite = declaredDependency(vitePlusManifest, 'vite');
const vitest = declaredDependency(vitePlusManifest, 'vitest');

const expectations: readonly Expectation[] = [
	{ expected: vite, from: 'vite-plus', fromManifest: vitePlus.path, specifier: 'vite' },
	{ expected: vitest, from: 'vite-plus', fromManifest: vitePlus.path, specifier: 'vitest' },
	// The coverage provider must be the Vitest it measures for (it is a devDependency).
	{
		expected: { name: '@vitest/coverage-v8', version: vitest.version },
		from: 'the package',
		fromManifest: rootManifest,
		specifier: '@vitest/coverage-v8',
	},
];

const installed = await Promise.all(
	expectations.map(async ({ fromManifest, specifier }) =>
		resolveInstalled(fromManifest, specifier),
	),
);
const mismatches = expectations.flatMap(({ expected, from, specifier }, index) => {
	const actual = installed[index]?.id;
	return actual?.name === expected.name && actual.version === expected.version
		? []
		: [
				`${from} resolves ${specifier} to ${actual === undefined ? 'nothing' : label(actual)}, ` +
					`but vite-plus ${label(vitePlus.id)} declares ${label(expected)}.`,
			];
});

if (mismatches.length > 0) {
	console.error(
		[
			...mismatches,
			'Set the catalog entries of vite and vitest in pnpm-workspace.yaml to these versions',
			'(`vp toolchain vite-plus-core`, `vp toolchain vitest`; @vitest/coverage-v8 takes the vitest version) and run `pnpm install`.',
		].join('\n'),
	);
	process.exitCode = 1;
} else {
	console.log(
		`vite-plus ${vitePlus.id.version}: vite ${label(vite)} and vitest ${label(vitest)} are installed as declared.`,
	);
}
