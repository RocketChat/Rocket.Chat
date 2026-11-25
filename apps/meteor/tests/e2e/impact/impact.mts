import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import path from 'node:path';

import { buildImportGraph, packageImpact, workspaceOf } from './packages.mts';

export type CoverageMap = {
	// Every instrumented file the browser loaded, exercised or not
	files: string[];
	// Repo-relative spec path -> indexes into `files` of the files it exercised
	specs: Record<string, number[]>;
};

type IstanbulFile = { path?: string; f?: Record<string, number> };

const COVERAGE_FILE = /^playwright_coverage_(.+)_[0-9a-f-]{36}\.json$/;

const SERVER_COVERAGE_FILE = /^server_coverage_(.+)_[0-9a-f-]{36}\.json$/;

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
		const server = name.match(SERVER_COVERAGE_FILE);
		if (server) {
			const recorded = decodeURIComponent(server[1]);
			const spec = recorded.startsWith('apps/') ? recorded : E2E_DIR + recorded;
			const files = exercised.get(spec) ?? new Set<string>();
			exercised.set(spec, files);
			for (const raw of JSON.parse(readFileSync(path.join(dir, name), 'utf8')) as string[]) {
				const file = toRepoPath(raw);
				if (file) {
					loaded.add(file);
					files.add(file);
				}
			}
			continue;
		}

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
			if (Object.values(entry.f ?? {}).some((count) => count > 0)) {
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

const NEVER_RELEVANT = [
	/^\.changeset\//,
	/^docs\//,
	/\.md$/,
	/^(?!apps\/meteor\/tests\/).*\.(spec|test)\.tsx?$/,
	/\.stories\.tsx?$/,
	/(^|\/)(\.oxlintrc[^/]*|\.eslintrc[^/]*|\.stylelintrc[^/]*|\.prettierrc[^/]*|\.editorconfig)$/,
];
const CLIENT_CODE = /^apps\/meteor\/(client|ee\/client)\//;

export type Suite = {
	dirs: string[];
	isSpec: (file: string) => boolean;
	// Changes that cannot affect what the suite exercises
	ignored: RegExp[];
	support: RegExp;
	// The suite reaches the app only over the network, so app client code cannot affect it
	serverOnly: boolean;
};

export const SUITES: Record<string, Suite> = {
	'ui': {
		dirs: [E2E_DIR],
		isSpec: (file) => file.startsWith(E2E_DIR) && file.endsWith('.spec.ts'),
		ignored: [...NEVER_RELEVANT, /^apps\/meteor\/tests\/(?!e2e\/)/],
		support: /^apps\/meteor\/tests\/e2e\//,
		serverOnly: false,
	},
	'api': {
		dirs: ['apps/meteor/tests/end-to-end/api/', 'apps/meteor/tests/end-to-end/apps/'],
		isSpec: (file) => /^apps\/meteor\/tests\/end-to-end\/(api|apps)\/.*\.ts$/.test(file),
		ignored: [
			...NEVER_RELEVANT,
			/^apps\/meteor\/tests\/(e2e|unit|mocks)\//,
			/^apps\/meteor\/tests\/end-to-end\/api-livechat\//,
			CLIENT_CODE,
		],
		support: /^apps\/meteor\/tests\//,
		serverOnly: true,
	},
	'api-livechat': {
		dirs: ['apps/meteor/tests/end-to-end/api-livechat/'],
		isSpec: (file) => /^apps\/meteor\/tests\/end-to-end\/api-livechat\/.*\.ts$/.test(file),
		ignored: [...NEVER_RELEVANT, /^apps\/meteor\/tests\/(e2e|unit|mocks)\//, /^apps\/meteor\/tests\/end-to-end\/(api|apps)\//, CLIENT_CODE],
		support: /^apps\/meteor\/tests\//,
		serverOnly: true,
	},
};

export type Selection = { all: boolean; skip: boolean; reasons: string[]; specs: string[]; packages?: string[] };

export type PackageSelection = { appFiles: string[]; specs: string[]; reasons: string[] };

// `alwaysRun` lists specs whose coverage the map cannot see, e.g. pages opened outside the coverage-collecting fixture
export function selectSpecs(
	map: CoverageMap,
	changed: string[],
	alwaysRun: string[],
	viaPackages: PackageSelection = { appFiles: [], specs: [], reasons: [] },
	suite: Suite = SUITES.ui,
): Selection {
	const specsByFile = new Map<string, string[]>(map.files.map((file) => [file, []]));
	for (const [spec, indexes] of Object.entries(map.specs)) {
		if (suite.isSpec(spec)) {
			indexes.forEach((i) => specsByFile.get(map.files[i])!.push(spec));
		}
	}

	const relevant = changed.filter((file) => !suite.ignored.some((re) => re.test(file)));
	const appFiles = suite.serverOnly ? viaPackages.appFiles.filter((file) => !CLIENT_CODE.test(file)) : viaPackages.appFiles;
	const reachesSuite = viaPackages.reasons.length > 0 || viaPackages.specs.length > 0 || appFiles.length > 0;
	if (!relevant.some((file) => !workspaceOf(file) || reachesSuite)) {
		return { all: false, skip: true, reasons: [], specs: [] };
	}

	const reasons: string[] = [];
	const specs = new Set(alwaysRun);
	for (const file of relevant) {
		if (workspaceOf(file)) {
			continue;
		}
		if (suite.isSpec(file)) {
			specs.add(file);
			continue;
		}
		if (suite.support.test(file)) {
			reasons.push(`test support file changed: ${file}`);
			continue;
		}
		const covering = specsByFile.get(file);
		if (!covering) {
			reasons.push(`not in coverage map: ${file}`);
			continue;
		}
		if (!covering.length) {
			reasons.push(`no spec covers: ${file}`);
			continue;
		}
		covering.forEach((spec) => specs.add(spec));
	}

	reasons.push(...viaPackages.reasons);
	viaPackages.specs.forEach((spec) => specs.add(spec));
	const fromPackages = appFiles.flatMap((file) => specsByFile.get(file) ?? []);
	if (appFiles.length && !fromPackages.length && !viaPackages.specs.length) {
		reasons.push('no spec runs the app code that imports the changed packages');
	}
	fromPackages.forEach((spec) => specs.add(spec));

	return { all: reasons.length > 0, skip: false, reasons, specs: reasons.length > 0 ? [] : [...specs].sort() };
}

// A change that leaves the JavaScript the same cannot change what a spec sees, and the typecheck covers it
export function changesOnlyTypes(file: string, before: string | undefined, after: string | undefined): boolean {
	if (file.endsWith('.d.ts')) {
		return true;
	}
	if (!/\.[cm]?ts$/.test(file) || before === undefined || after === undefined) {
		return false;
	}
	try {
		return stripTypeScriptTypes(before, { mode: 'transform' }) === stripTypeScriptTypes(after, { mode: 'transform' });
	} catch {
		return false;
	}
}

function listSpecs(repoRoot: string, suite: Suite): string[] {
	return suite.dirs
		.filter((dir) => existsSync(path.join(repoRoot, dir)))
		.flatMap((dir) =>
			readdirSync(path.join(repoRoot, dir), { recursive: true, encoding: 'utf8' }).map((file) =>
				path.posix.join(dir, file.replace(/\\/g, '/')),
			),
		)
		.filter(suite.isSpec);
}

const BYPASSES_FIXTURE = /\bbrowser\.new(Page|Context)\(/;
const DRIVES_WIDGET = /\bOmnichannelLiveChat(Embedded)?\b/;

function selectAll(mapFile: string, base: string, suiteNames: string[]): Record<string, Selection> {
	const repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
	const map: CoverageMap = JSON.parse(readFileSync(mapFile, 'utf8'));
	const show = (rev: string, file: string) => {
		try {
			return execFileSync('git', ['show', `${rev}:${file}`], { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
		} catch {
			return undefined;
		}
	};
	const changed = execFileSync('git', ['diff', '--name-only', `${base}...HEAD`], { cwd: repoRoot, encoding: 'utf8' })
		.split('\n')
		.filter(Boolean)
		.filter((file) => !changesOnlyTypes(file, show(base, file), show('HEAD', file)));
	const read = (file: string) => readFileSync(path.join(repoRoot, file), 'utf8');
	let graph: ReturnType<typeof buildImportGraph> | undefined;

	return Object.fromEntries(
		suiteNames.map((name) => {
			const suite = SUITES[name];
			const specs = listSpecs(repoRoot, suite);
			const alwaysRun = specs.filter((spec) => !map.specs[spec] || (suite === SUITES.ui && BYPASSES_FIXTURE.test(read(spec))));
			let viaPackages: PackageSelection | undefined;
			let packages: string[] | undefined;
			const packageFiles = changed.filter((file) => workspaceOf(file) && !suite.ignored.some((re) => re.test(file)));
			if (packageFiles.length) {
				graph ??= buildImportGraph(repoRoot);
				const impact = packageImpact(graph, packageFiles);
				const widgetSpecs = impact.widget && suite === SUITES.ui ? specs.filter((spec) => DRIVES_WIDGET.test(read(spec))) : [];
				viaPackages = { appFiles: impact.appFiles, specs: widgetSpecs, reasons: impact.reasons };
				packages = impact.trace;
			}
			const selection = selectSpecs(map, changed, alwaysRun, viaPackages, suite);
			selection.specs = selection.specs.filter((spec) => existsSync(path.join(repoRoot, spec)));
			selection.packages = packages;
			return [name, selection];
		}),
	);
}

const SPECS_PER_SHARD = 15;
const MAX_SHARDS = 3;

// The job outputs ci.yml reads; an empty specs output means the full suite, never zero tests
export function ciOutputs(selections: Record<string, Selection>): Record<string, string> {
	const outputs: Record<string, string> = {};
	for (const [name, selection] of Object.entries(selections)) {
		const prefix = name === 'ui' ? '' : `${name}-`;
		outputs[`${prefix}specs`] = selection.all ? '' : selection.specs.map((spec) => spec.replace(/^apps\/meteor\//, '')).join(' ');
		outputs[`${prefix}skip`] = String(selection.skip);
	}
	const { ui } = selections;
	const count = ui && !ui.all ? ui.specs.length : 0;
	if (count > 0 && count <= SPECS_PER_SHARD * MAX_SHARDS) {
		const total = Math.ceil(count / SPECS_PER_SHARD);
		outputs['total-shard'] = String(total);
		outputs.shards = JSON.stringify(Array.from({ length: total }, (_, i) => i + 1));
	}
	return outputs;
}

function main([command, ...args]: string[]): void {
	if (command === 'build') {
		const [out, ...inputs] = args;
		writeFileSync(out, JSON.stringify(buildMap(inputs)));
		return;
	}

	if (command === 'select') {
		const [mapFile, base, suiteName = 'ui'] = args;
		process.stdout.write(`${JSON.stringify(selectAll(mapFile, base, [suiteName])[suiteName], null, 2)}\n`);
		return;
	}

	if (command === 'ci') {
		const [mapFile, base] = args;
		const selections = selectAll(mapFile, base, Object.keys(SUITES));
		const outputs = ciOutputs(selections);
		const write = (file: string | undefined, text: string) => (file ? appendFileSync(file, text) : process.stdout.write(text));
		write(
			process.env.GITHUB_OUTPUT,
			Object.entries(outputs)
				.map(([key, value]) => `${key}=${value}\n`)
				.join(''),
		);
		write(
			process.env.GITHUB_STEP_SUMMARY,
			[
				'### 🎯 E2E impact selection',
				...Object.entries(selections).flatMap(([name, selection]) => [
					`#### ${name}`,
					'```json',
					JSON.stringify(selection, null, 2),
					'```',
				]),
				'',
			].join('\n'),
		);
		return;
	}

	console.error(
		[
			'usage: node impact.mts build <out.json> <.nyc_output dir | map.json>...',
			'       node impact.mts select <map.json> <base-ref> [ui|api|api-livechat]',
			'       node impact.mts ci <map.json> <base-ref>',
		].join('\n'),
	);
	process.exit(1);
}

if (import.meta.main) {
	main(process.argv.slice(2));
}
