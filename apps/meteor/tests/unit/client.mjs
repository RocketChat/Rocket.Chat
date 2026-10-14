import { spawn } from 'node:child_process';
import { createWriteStream, globSync, mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { availableParallelism, tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { PassThrough } from 'node:stream';
import { run } from 'node:test';
import { spec as SpecReporter } from 'node:test/reporters';

const args = process.argv.slice(2);
const flags = args.filter((arg) => arg.startsWith('--'));
const given = args.filter((arg) => !arg.startsWith('--'));
const files = given.length ? given : globSync('**/client/**/*.test.{ts,tsx}', { exclude: ['**/node_modules/**'] });

// A file needs its own process when it leaves state behind for the files that share one: module mocks, hooks, a fake
// clock or DOM nodes at its top level, or writes to the browser globals or to objects it imports from the app.
const topLevelState =
	/^(?:mock\.module|beforeEach|afterEach|before|after)\(|^(?:const )?clock = sinon|^(?!import\b)\S[^\n]*\bdocument\.(?:body|head|documentElement|createElement)\b/m;
const globalWrite =
	/\b(?:window|global|globalThis|navigator|document)(?:\s+as\s+[\w<>[\]]+)?\)?\.\w+\s*=(?!=)|Object\.(?:defineProperty|assign)\(\s*(?:window|global|globalThis|navigator|document)\b/;
const appImports = (source) =>
	[...source.matchAll(/^import\s+(?!type\b)([^'";]*?)\s+from\s+'((?:\.|\/)[^']*)'/gm)].flatMap(([, clause]) =>
		[...clause.replace(/\{|\}|\*\s+as\s+/g, ',').split(',')]
			.map((name) =>
				name
					.trim()
					.split(/\s+as\s+/)
					.pop(),
			)
			.filter((name) => /^\w+$/.test(name ?? '')),
	);
const writesImport = (source) =>
	appImports(source).some((name) => new RegExp(`(?:^|[\\s;(])\\(?\\s*${name}(?:\\s+as\\s+[^)]+\\))?\\.\\w+\\s*=(?!=)`, 'm').test(source));
const needsOwnProcess = (file) => {
	const source = readFileSync(file, 'utf8');
	return topLevelState.test(source) || globalWrite.test(source) || writesImport(source);
};
const isolated = files.filter(needsOwnProcess);
const shared = files.filter((file) => !isolated.includes(file));

// meteor/* resolves through tsconfig paths for import() and mock.module, and through NODE_PATH for require() once a module is mocked
const env = {
	...process.env,
	NODE_ENV: 'test',
	TZ: process.env.TZ ?? 'UTC',
	TSX_TSCONFIG_PATH: 'tsconfig.client-test.json',
	NODE_PATH: path.resolve('tests/mocks/client/modules'),
};
Object.assign(process.env, env);
const preload = [
	'--experimental-test-module-mocks',
	'--preserve-symlinks',
	'--require',
	'tsx',
	'--require',
	'./tests/setup/clientEnvironment.ts',
];
const parityReporter = process.env.TEST_PARITY_REPORTER;
const parityOut = (name) =>
	parityReporter
		? [
				'--test-reporter=spec',
				'--test-reporter-destination=stdout',
				`--test-reporter=${parityReporter}`,
				`--test-reporter-destination=${path.join(process.env.TEST_PARITY_DIR, `${name}.json`)}`,
			]
		: [];

const shards = Math.max(1, Math.min(Number(process.env.TEST_SHARDS) || availableParallelism() - 1, Math.ceil(shared.length / 10)));
const failedDir = mkdtempSync(path.join(tmpdir(), 'client-tests-'));

const runIsolated = async (testFiles, name) => {
	const stream = run({ files: testFiles, concurrency: Number(process.env.TEST_CONCURRENCY) || true, execArgv: [...preload, ...flags] });
	const spec = new PassThrough({ objectMode: true });
	stream.pipe(spec).compose(new SpecReporter()).pipe(process.stdout);
	if (parityReporter) {
		const parity = new PassThrough({ objectMode: true });
		const { default: reporter } = await import(parityReporter);
		stream
			.pipe(parity)
			.compose(reporter)
			.pipe(createWriteStream(path.join(process.env.TEST_PARITY_DIR, `${name}.json`)));
	}
	return new Promise((resolve) => {
		let failed = false;
		stream.on('test:fail', () => {
			failed = true;
		});
		stream.on('end', () => resolve(failed ? 1 : 0));
	});
};

const sharedRuns = [];
for (let index = 1; index <= (shared.length ? shards : 0); index++) {
	const report = [
		'--test-reporter=./tests/unit/failedFilesReporter.mjs',
		`--test-reporter-destination=${path.join(failedDir, `${index}.txt`)}`,
	];
	const argv = [
		'--test',
		'--test-isolation=none',
		`--test-shard=${index}/${shards}`,
		...preload,
		...(parityOut(`shared-${index}`).length
			? parityOut(`shared-${index}`)
			: ['--test-reporter=spec', '--test-reporter-destination=stdout']),
		...report,
		...flags,
		...shared,
	];
	sharedRuns.push(new Promise((resolve) => spawn(process.execPath, argv, { stdio: 'inherit', env }).on('exit', resolve)));
}

const [isolatedExit] = await Promise.all([isolated.length ? runIsolated(isolated, 'isolated') : 0, ...sharedRuns]);

// A file that fails while sharing a process is judged in a process of its own, as Jest runs each file in its own environment
const failedShared = readdirSync(failedDir)
	.flatMap((name) => readFileSync(path.join(failedDir, name), 'utf8').split('\n'))
	.filter(Boolean);
let rerunExit = 0;
if (failedShared.length) {
	console.log(
		`\nRunning ${failedShared.length} file(s) that failed in a shared process again in their own process:\n  ${failedShared.join('\n  ')}\n`,
	);
	rerunExit = await runIsolated(failedShared, 'rerun');
	if (!rerunExit) {
		console.log(
			`\nThese files pass on their own but not next to others; something leaves state behind for them:\n  ${failedShared.join('\n  ')}\n`,
		);
	}
}

process.exitCode = isolatedExit || rerunExit ? 1 : 0;
