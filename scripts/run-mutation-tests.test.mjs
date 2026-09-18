import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));
const clientConfig = `
import client from '@rocket.chat/jest-presets/client';
export default {
	preset: client.preset,
	moduleNameMapper: {
		'^react$': '<rootDir>/../../node_modules/react',
		'^local$': '<rootDir>/src/isPositive.ts',
	},
};
`;

async function fixture(t, config = clientConfig) {
	const temporaryRoot = resolve(root, '.stryker-tmp');
	await mkdir(temporaryRoot, { recursive: true });
	const directory = await mkdtemp(resolve(temporaryRoot, 'tooling-test-'));
	t.after(() => rm(directory, { recursive: true, force: true }));
	const files = {
		'package.json': JSON.stringify({ name: 'mutation-tooling-fixture', private: true }),
		'jest.config.ts': config,
		'src/isPositive.ts': 'export const isPositive = (value: number) => value > 0;',
		'src/isPositive.spec.ts': `
import { createElement } from 'react';
import { isPositive } from 'local';
test.each([-1, 0, 1])('checks the boundary for %s', (value) => {
	expect(isPositive(value)).toBe(value === 1);
	expect(createElement('div').type).toBe('div');
	expect(document.createElement('div').tagName).toBe('DIV');
});
`,
	};
	await Promise.all(
		Object.entries(files).map(async ([name, content]) => {
			const path = resolve(directory, name);
			await mkdir(dirname(path), { recursive: true });
			await writeFile(path, content);
		}),
	);
	return directory;
}

function run(directory, ...args) {
	return exec(process.execPath, ['scripts/run-mutation-tests.mjs', relative(root, directory), '--cleanTempDir', 'always', ...args], {
		cwd: root,
		timeout: 60_000,
	});
}

test('preserves preset jsdom and external aliases while local aliases exercise mutants', async (t) => {
	const directory = await fixture(t);
	await run(directory, '--mutate', 'src/isPositive.ts');
	const report = JSON.parse(await readFile(resolve(directory, 'reports/mutation/mutation.json'), 'utf8'));
	const summary = JSON.parse(await readFile(resolve(directory, 'reports/mutation/summary.json'), 'utf8'));
	assert.equal(summary.status, 'complete');
	assert.equal(summary.score, 100);
	assert.equal(summary.gate, 'disabled');
	const { mutants } = report.files['src/isPositive.ts'];
	assert.ok(mutants.length > 0);
	assert.ok(
		mutants.every(({ status }) => status === 'Killed'),
		JSON.stringify(mutants),
	);
});

for (const scope of ['src/missing.ts', 'src/isPositive.ts,!src/isPositive.ts']) {
	test(`rejects an empty selection before tests run: ${scope}`, async (t) => {
		const directory = await fixture(t);
		await assert.rejects(run(directory, '--mutate', scope, '--dryRunOnly'), (error) => {
			assert.equal(error.code, 3);
			assert.match(error.stdout + error.stderr, /No production files matched the mutation scope/);
			assert.doesNotMatch(error.stdout, /Starting initial test run/);
			return true;
		});
	});
}

test('rejects multi-project Jest configurations explicitly', async (t) => {
	const directory = await fixture(
		t,
		`export default { projects: [{ displayName: 'one', rootDir: '.' }, { displayName: 'two', rootDir: '.' }] };`,
	);
	await assert.rejects(run(directory, '--mutate', 'src/isPositive.ts', '--dryRunOnly'), (error) => {
		assert.equal(error.code, 3);
		assert.match(error.stdout + error.stderr, /Multi-project configurations need a dedicated setup/);
		return true;
	});
});

test('summary distinguishes weak tests from tool errors and supports an optional gate', async (t) => {
	const directory = await fixture(t);
	await writeFile(
		resolve(directory, 'src/isPositive.spec.ts'),
		`
import { isPositive } from 'local';
test('only checks an ordinary positive input', () => expect(isPositive(1)).toBe(true));
`,
	);
	await run(directory, '--mutate', 'src/isPositive.ts', '--reporters', 'clear-text');
	let summary = JSON.parse(await readFile(resolve(directory, 'reports/mutation/summary.json'), 'utf8'));
	assert.equal(summary.status, 'complete');
	assert.ok(summary.survivors.length > 0);
	assert.ok(summary.survivors.some(({ coveringTests }) => coveringTests.some(({ name }) => name.includes('ordinary positive'))));
	await assert.rejects(run(directory, '--mutate', 'src/isPositive.ts', '--min-score', '100'), { code: 1 });
	summary = JSON.parse(await readFile(resolve(directory, 'reports/mutation/summary.json'), 'utf8'));
	assert.equal(summary.status, 'complete');
	assert.equal(summary.gate, 'failed');
});

test('dry and failed runs replace stale successful reports without claiming a score', async (t) => {
	const directory = await fixture(t);
	const reports = resolve(directory, 'reports/mutation');
	const seedOldReport = async () => {
		await mkdir(reports, { recursive: true });
		await writeFile(resolve(reports, 'mutation.json'), JSON.stringify({ files: { stale: { mutants: [] } } }));
		await writeFile(resolve(reports, 'mutation.html'), 'old report');
		await writeFile(resolve(reports, 'summary.json'), JSON.stringify({ status: 'complete', score: 100 }));
	};
	await seedOldReport();
	await run(directory, '--mutate', 'src/isPositive.ts', '--dryRunOnly');
	let summary = JSON.parse(await readFile(resolve(reports, 'summary.json'), 'utf8'));
	assert.equal(summary.status, 'dry-run');
	assert.equal(summary.score, null);
	await assert.rejects(readFile(resolve(reports, 'mutation.json')), { code: 'ENOENT' });
	await assert.rejects(readFile(resolve(reports, 'mutation.html')), { code: 'ENOENT' });
	await seedOldReport();
	await writeFile(resolve(directory, 'src/isPositive.spec.ts'), 'test("broken baseline", () => expect(false).toBe(true));');
	await assert.rejects(run(directory, '--mutate', 'src/isPositive.ts'), { code: 3 });
	summary = JSON.parse(await readFile(resolve(reports, 'summary.json'), 'utf8'));
	assert.equal(summary.status, 'failed');
	assert.equal(summary.score, null);
	assert.equal(summary.survivors.length, 0);
});

test('batched line ranges mutate the selected lines and leave other lines and source bytes unchanged', async (t) => {
	const directory = await fixture(t);
	const source =
		'export const isPositive = (value: number) => value > 0;\nexport const untouched = () => false;\nexport const alsoChanged = () => true;\n';
	await writeFile(resolve(directory, 'src/isPositive.ts'), source);
	await run(directory, '--mutate', 'src/isPositive.ts:1-1,src/isPositive.ts:3-3');
	const report = JSON.parse(await readFile(resolve(directory, 'reports/mutation/mutation.json'), 'utf8'));
	const lines = new Set(report.files['src/isPositive.ts'].mutants.map(({ location }) => location.start.line));
	assert.deepEqual([...lines].sort(), [1, 3]);
	assert.equal(await readFile(resolve(directory, 'src/isPositive.ts'), 'utf8'), source);
});

test('invalid wrapper arguments fail before creating mutation reports', async (t) => {
	const directory = await fixture(t);
	for (const args of [['--min-score', '101'], ['--min-score', 'NaN'], ['--min-score', '80', '--dryRunOnly'], ['--diff'], ['--inPlace']]) {
		await assert.rejects(run(directory, ...args), { code: 2 });
	}
	await assert.rejects(readFile(resolve(directory, 'reports/mutation/summary.json')), { code: 'ENOENT' });
});

test('diff CLI runs separate workspace packages with real Stryker and preserves working changes', async (t) => {
	const directory = await mkdtemp(resolve(root, '.stryker-tmp/diff-tooling-'));
	t.after(() => rm(directory, { recursive: true, force: true }));
	const write = async (file, text) => {
		await mkdir(dirname(resolve(directory, file)), { recursive: true });
		await writeFile(resolve(directory, file), text);
	};
	const git = async (...args) => (await exec('git', args, { cwd: directory })).stdout;
	await symlink(resolve(root, 'node_modules'), resolve(directory, 'node_modules'), 'dir');
	await write('package.json', JSON.stringify({ workspaces: ['packages/*'] }));
	await write('.gitignore', 'node_modules\n.stryker-tmp\nreports\n');
	await mkdir(resolve(directory, 'scripts'));
	for (const file of [
		'stryker.config.mjs',
		'scripts/run-mutation-tests.mjs',
		'scripts/mutation-worker.mjs',
		'scripts/mutation-diff.mjs',
		'scripts/mutation-summary.mjs',
		'scripts/mutation-jest-config.mjs',
		'scripts/mutation-target-reporter.mjs',
	])
		await copyFile(resolve(root, file), resolve(directory, file));
	const beforeSource =
		'export const positive = (n: number) => n > 0;\nexport const untouched = () => false;\nexport const negative = (n: number) => n < 0;\n';
	const afterSource =
		'export const positive = (n: number) => 0 < n;\nexport const untouched = () => false;\nexport const negative = (n: number) => 0 > n;\n';
	for (const pkg of ['first', 'second']) {
		await write(`packages/${pkg}/package.json`, '{}');
		await write(
			`packages/${pkg}/jest.config.ts`,
			`import server from '@rocket.chat/jest-presets/server'; export default { preset: server.preset };`,
		);
		await write(`packages/${pkg}/src/example.ts`, beforeSource);
		await write(
			`packages/${pkg}/src/example.spec.ts`,
			`
import { positive, negative } from './example';
test.each([-1, 0, 1])('checks boundaries for %s', (n) => {
  expect(positive(n)).toBe(n === 1);
  expect(negative(n)).toBe(n === -1);
});
`,
		);
	}
	await git('init', '-q');
	await git('config', 'user.email', 'mutation-fixture@example.invalid');
	await git('config', 'user.name', 'Mutation fixture');
	await git('config', 'commit.gpgsign', 'false');
	await git('config', 'core.hooksPath', '/dev/null');
	await git('add', '.');
	await git('commit', '-qm', 'Fixture baseline');
	await git('branch', 'base');
	for (const pkg of ['first', 'second']) await write(`packages/${pkg}/src/example.ts`, afterSource);
	const statusBefore = await git('status', '--porcelain');
	await exec(process.execPath, ['scripts/run-mutation-tests.mjs', '--diff', '--base', 'base', '--reporters', 'clear-text'], {
		cwd: directory,
		timeout: 60_000,
	});
	for (const pkg of ['first', 'second']) {
		const summary = JSON.parse(await readFile(resolve(directory, `packages/${pkg}/reports/mutation/summary.json`), 'utf8'));
		assert.equal(summary.status, 'complete');
		assert.equal(summary.score, 100);
		assert.deepEqual(summary.targets, ['src/example.ts:1-1', 'src/example.ts:3-3']);
		assert.equal(await readFile(resolve(directory, `packages/${pkg}/src/example.ts`), 'utf8'), afterSource);
	}
	assert.equal(await git('status', '--porcelain'), statusBefore);
});

test('SIGTERM forwards cancellation and writes a failed assessment without altering source', { timeout: 30_000 }, async (t) => {
	const directory = await fixture(t);
	const source = await readFile(resolve(directory, 'src/isPositive.ts'), 'utf8');
	await writeFile(
		resolve(directory, 'src/isPositive.spec.ts'),
		`
import { isPositive } from 'local';
test('slow baseline', async () => {
  await new Promise((resolve) => setTimeout(resolve, 10000));
  expect(isPositive(1)).toBe(true);
}, 20000);
`,
	);
	const child = spawn(process.execPath, ['scripts/run-mutation-tests.mjs', relative(root, directory), '--mutate', 'src/isPositive.ts'], {
		cwd: root,
		stdio: ['ignore', 'pipe', 'pipe'],
	});
	t.after(() => {
		if (child.exitCode === null) child.kill('SIGTERM');
	});
	let output = '';
	let cancelled = false;
	child.stdout.on('data', (data) => {
		output += data;
		if (!cancelled && output.includes('Starting initial test run')) {
			cancelled = true;
			child.kill('SIGTERM');
		}
	});
	child.stderr.on('data', (data) => {
		output += data;
	});
	const code = await new Promise((done, reject) => {
		child.on('close', done);
		child.on('error', reject);
	});
	assert.equal(cancelled, true, output);
	assert.equal(code, 143, output);
	const summary = JSON.parse(await readFile(resolve(directory, 'reports/mutation/summary.json'), 'utf8'));
	assert.equal(summary.status, 'failed');
	assert.equal(summary.signal, 'SIGTERM');
	assert.equal(summary.score, null);
	assert.equal(await readFile(resolve(directory, 'src/isPositive.ts'), 'utf8'), source);
});
