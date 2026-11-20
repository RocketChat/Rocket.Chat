import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export type CoverageMap = {
	// Every instrumented file the browser loaded, exercised or not
	files: string[];
	// Repo-relative spec path -> indexes into `files` of the files it exercised
	specs: Record<string, number[]>;
};

type IstanbulFile = { path?: string; s?: Record<string, number> };

const COVERAGE_FILE = /^playwright_coverage_(.+)_[0-9a-f-]{36}\.json$/;

const E2E_DIR = 'apps/meteor/tests/e2e/';

export function toRepoPath(raw: string): string | undefined {
	const p = raw.replace(/\\/g, '/');
	if (/(?:^|\/)node_modules\//.test(p)) {
		return;
	}
	const meteor = p.indexOf('apps/meteor/');
	if (meteor !== -1) {
		return p.slice(meteor);
	}
	// Meteor reports paths relative to the app, `packages/` included (Meteor packages, not the monorepo's)
	return path.posix.join('apps/meteor', p);
}

function readNycOutput(dir: string, loaded: Set<string>, exercised: Map<string, Set<string>>): void {
	for (const name of readdirSync(dir)) {
		const match = name.match(COVERAGE_FILE);
		if (!match) {
			continue;
		}
		const spec = E2E_DIR + decodeURIComponent(match[1]);
		const coverage: Record<string, IstanbulFile> = JSON.parse(readFileSync(path.join(dir, name), 'utf8'));
		const files = exercised.get(spec) ?? new Set<string>();
		exercised.set(spec, files);

		for (const [key, entry] of Object.entries(coverage)) {
			const file = toRepoPath(entry.path ?? key);
			if (!file) {
				continue;
			}
			loaded.add(file);
			if (Object.values(entry.s ?? {}).some((count) => count > 0)) {
				files.add(file);
			}
		}
	}
}

function readMap(map: CoverageMap, loaded: Set<string>, exercised: Map<string, Set<string>>): void {
	map.files.forEach((file) => loaded.add(file));
	for (const [spec, indexes] of Object.entries(map.specs)) {
		const files = exercised.get(spec) ?? new Set<string>();
		indexes.forEach((i) => files.add(map.files[i]));
		exercised.set(spec, files);
	}
}

function toMap(loaded: Set<string>, exercised: Map<string, Set<string>>): CoverageMap {
	const files = [...loaded].sort();
	const index = new Map(files.map((file, i) => [file, i]));
	const specs = Object.fromEntries(
		[...exercised.entries()]
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([spec, set]) => [spec, [...set].map((f) => index.get(f)!).sort((a, b) => a - b)]),
	);
	return { files, specs };
}

// Accepts .nyc_output directories (one per shard) and previously built maps, so shard fragments can be merged
export function buildMap(inputs: string[]): CoverageMap {
	const loaded = new Set<string>();
	const exercised = new Map<string, Set<string>>();
	for (const input of inputs) {
		if (statSync(input).isDirectory()) {
			readNycOutput(input, loaded, exercised);
		} else {
			readMap(JSON.parse(readFileSync(input, 'utf8')), loaded, exercised);
		}
	}
	return toMap(loaded, exercised);
}

// Changes that cannot affect what the UI suite exercises
const IGNORED = [
	/^\.changeset\//,
	/^docs\//,
	/\.md$/,
	/^apps\/meteor\/tests\/(?!e2e\/)/,
	/^(?!apps\/meteor\/tests\/e2e\/).*\.(spec|test)\.tsx?$/,
];

export type Selection = { all: boolean; reasons: string[]; specs: string[] };

// `alwaysRun` lists specs whose coverage the map cannot see, e.g. pages opened outside the coverage-collecting fixture
export function selectSpecs(map: CoverageMap, changed: string[], alwaysRun: string[]): Selection {
	const specsByFile = new Map<string, string[]>(map.files.map((file) => [file, []]));
	for (const [spec, indexes] of Object.entries(map.specs)) {
		indexes.forEach((i) => specsByFile.get(map.files[i])!.push(spec));
	}

	const reasons: string[] = [];
	const specs = new Set(alwaysRun);
	for (const file of changed) {
		if (IGNORED.some((re) => re.test(file))) {
			continue;
		}
		if (file.startsWith(E2E_DIR)) {
			if (file.endsWith('.spec.ts')) {
				specs.add(file);
			} else {
				reasons.push(`e2e support file changed: ${file}`);
			}
			continue;
		}
		const covering = specsByFile.get(file);
		if (!covering) {
			reasons.push(`not in coverage map: ${file}`);
			continue;
		}
		covering.forEach((spec) => specs.add(spec));
	}

	return { all: reasons.length > 0, reasons, specs: reasons.length > 0 ? [] : [...specs].sort() };
}

function listSpecs(dir: string): string[] {
	return readdirSync(dir, { recursive: true, encoding: 'utf8' })
		.filter((file) => file.endsWith('.spec.ts'))
		.map((file) => path.posix.join(E2E_DIR, file.replace(/\\/g, '/')));
}

const BYPASSES_FIXTURE = /\bbrowser\.new(Page|Context)\(/;

function main([command, ...args]: string[]): void {
	if (command === 'build') {
		const [out, ...inputs] = args;
		writeFileSync(out, JSON.stringify(buildMap(inputs)));
		return;
	}

	if (command === 'select') {
		const [mapFile, base] = args;
		const repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
		const map: CoverageMap = JSON.parse(readFileSync(mapFile, 'utf8'));
		const changed = execFileSync('git', ['diff', '--name-only', `${base}...HEAD`], { cwd: repoRoot, encoding: 'utf8' })
			.split('\n')
			.filter(Boolean);
		const specs = listSpecs(path.join(repoRoot, E2E_DIR));
		const alwaysRun = specs.filter((spec) => !map.specs[spec] || BYPASSES_FIXTURE.test(readFileSync(path.join(repoRoot, spec), 'utf8')));
		const selection = selectSpecs(map, changed, alwaysRun);
		selection.specs = selection.specs.filter((spec) => existsSync(path.join(repoRoot, spec)));
		process.stdout.write(`${JSON.stringify(selection, null, 2)}\n`);
		return;
	}

	console.error(
		'usage: node impact.mts build <out.json> <.nyc_output dir | map.json>...\n       node impact.mts select <map.json> <base-ref>',
	);
	process.exit(1);
}

if (import.meta.main) {
	main(process.argv.slice(2));
}
