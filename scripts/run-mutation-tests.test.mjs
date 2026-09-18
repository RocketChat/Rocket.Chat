import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
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
	const report = JSON.parse(await readFile(resolve(directory, 'reports/mutation/jest/mutation.json'), 'utf8'));
	const summary = JSON.parse(await readFile(resolve(directory, 'reports/mutation/jest/summary.json'), 'utf8'));
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

test('Jest projects preserve client/server environments, setup, and aliases while detecting shared mutations', async (t) => {
	const directory = await fixture(
		t,
		`
import client from '@rocket.chat/jest-presets/client';
import server from '@rocket.chat/jest-presets/server';
export default { projects: [
  { displayName: 'client', preset: client.preset, testMatch: ['<rootDir>/src/isPositive.spec.ts'],
    testEnvironmentOptions: { url: 'https://mutation.example.test/' },
    setupFilesAfterEnv: [...client.setupFilesAfterEnv, '<rootDir>/client-setup.ts'],
    moduleNameMapper: { '^react$': '<rootDir>/../../node_modules/react', '^local$': '<rootDir>/src/isPositive.ts' } },
  { displayName: 'server', preset: server.preset, testMatch: ['<rootDir>/src/server.spec.ts'],
    setupFilesAfterEnv: ['<rootDir>/server-setup.ts'],
    moduleNameMapper: { '^local$': '<rootDir>/src/isPositive.ts' } },
] };
`,
	);
	await writeFile(resolve(directory, 'tsconfig.json'), JSON.stringify({ compilerOptions: { allowJs: true } }));
	await writeFile(resolve(directory, 'client-setup.ts'), "globalThis.projectSetup = 'client';");
	await writeFile(resolve(directory, 'server-setup.ts'), "globalThis.projectSetup = 'server';");
	await writeFile(
		resolve(directory, 'src/isPositive.spec.ts'),
		`
import { createElement } from 'react';
import { isPositive } from 'local';
test('client covers the positive case', () => {
  expect(globalThis.projectSetup).toBe('client');
  expect(window.location.href).toBe('https://mutation.example.test/');
  expect(document.createElement('div')).toBeEmptyDOMElement();
  expect(createElement('div').type).toBe('div');
  expect(isPositive(1)).toBe(true);
});
`,
	);
	await writeFile(resolve(directory, 'src/isNegative.ts'), 'export const isNegative = (value: number) => value < 0;');
	await writeFile(
		resolve(directory, 'src/server.spec.ts'),
		`
import { isPositive } from 'local';
import { isNegative } from './isNegative';
test.each([-1, 0, 1])('server checks %s', (value) => {
  expect(globalThis.projectSetup).toBe('server');
  expect(typeof document).toBe('undefined');
  if (value !== 1) expect(isPositive(value)).toBe(false);
  expect(isNegative(value)).toBe(value === -1);
});
`,
	);
	const source = await readFile(resolve(directory, 'src/isPositive.ts'), 'utf8');
	await run(directory, '--mutate', 'src/isPositive.ts,src/isNegative.ts', '--min-score', '100').catch((error) =>
		assert.fail(error.stdout + error.stderr),
	);
	const report = JSON.parse(await readFile(resolve(directory, 'reports/mutation/jest/mutation.json'), 'utf8'));
	const summary = JSON.parse(await readFile(resolve(directory, 'reports/mutation/jest/summary.json'), 'utf8'));
	assert.equal(summary.status, 'complete');
	assert.equal(summary.score, 100);
	for (const file of ['src/isPositive.ts', 'src/isNegative.ts']) {
		assert.ok(report.files[file].mutants.length > 0);
		assert.ok(report.files[file].mutants.every(({ status }) => status === 'Killed'));
	}
	assert.equal(await readFile(resolve(directory, 'src/isPositive.ts'), 'utf8'), source);
});

test('rejects Jest projects with different roots explicitly', async (t) => {
	const directory = await fixture(t, `export default { projects: [{ rootDir: '.' }, { rootDir: './src' }] };`);
	await assert.rejects(run(directory, '--mutate', 'src/isPositive.ts', '--dryRunOnly'), (error) => {
		assert.equal(error.code, 3);
		assert.match(error.stdout + error.stderr, /inline Jest projects sharing the package root/);
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
	let summary = JSON.parse(await readFile(resolve(directory, 'reports/mutation/jest/summary.json'), 'utf8'));
	assert.equal(summary.status, 'complete');
	assert.ok(summary.survivors.length > 0);
	assert.ok(summary.survivors.some(({ coveringTests }) => coveringTests.some(({ name }) => name.includes('ordinary positive'))));
	await assert.rejects(run(directory, '--mutate', 'src/isPositive.ts', '--min-score', '100'), { code: 1 });
	summary = JSON.parse(await readFile(resolve(directory, 'reports/mutation/jest/summary.json'), 'utf8'));
	assert.equal(summary.status, 'complete');
	assert.equal(summary.gate, 'failed');
});

test('dry and failed runs replace stale successful reports without claiming a score', async (t) => {
	const directory = await fixture(t);
	const reports = resolve(directory, 'reports/mutation/jest');
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
	const report = JSON.parse(await readFile(resolve(directory, 'reports/mutation/jest/mutation.json'), 'utf8'));
	const lines = new Set(report.files['src/isPositive.ts'].mutants.map(({ location }) => location.start.line));
	assert.deepEqual([...lines].sort(), [1, 3]);
	assert.equal(await readFile(resolve(directory, 'src/isPositive.ts'), 'utf8'), source);
});

test('Mocha preserves TypeScript setup, scopes tests, and continues after invalid Jest configurations', async (t) => {
	const directory = await fixture(t, "throw new Error('Invalid Jest fixture configuration'); export default {};");
	const requireMeteor = createRequire(resolve(root, 'apps/meteor/package.json'));
	await writeFile(
		resolve(directory, '.mocharc.base.json'),
		JSON.stringify({ extension: ['ts'], require: [requireMeteor.resolve('tsx'), './setup.cjs'] }),
	);
	await writeFile(resolve(directory, '.mocharc.js'), "module.exports = { ...require('./.mocharc.base.json'), spec: ['src/*.spec.ts'] };");
	await writeFile(resolve(directory, 'setup.cjs'), 'globalThis.mutationSetupLoaded = true;');
	const source = await readFile(resolve(directory, 'src/isPositive.ts'), 'utf8');
	const writeTests = (values) =>
		writeFile(
			resolve(directory, 'src/mocha.tests.ts'),
			`
import assert from 'node:assert/strict';
import { it } from 'mocha';
import { isPositive } from './isPositive';
for (const value of ${JSON.stringify(values)}) {
  it('checks the boundary for ' + value, () => {
    assert.equal(globalThis.mutationSetupLoaded, true);
    assert.equal(isPositive(value), value > 0);
  });
}
`,
		);
	// The configured spec is a Jest test: --testFiles must replace it, not append to it.
	const args = ['--testRunner', 'mocha', '--testFiles', 'src/mocha.tests.ts', '--mutate', 'src/isPositive.ts'];
	await writeTests([-1, 0, 1]);
	await run(directory, ...args, '--min-score', '100').catch((error) => assert.fail(error.stdout + error.stderr));
	let summary = JSON.parse(await readFile(resolve(directory, 'reports/mutation/mocha/summary.json'), 'utf8'));
	assert.equal(summary.testRunner, 'mocha');
	assert.equal(summary.status, 'complete');
	assert.equal(summary.score, 100);
	assert.ok(summary.counts.Killed > 0);
	assert.equal(summary.gate, 'passed');
	await writeTests([1]);
	await assert.rejects(run(directory, ...args, '--min-score', '100'), { code: 1 });
	summary = JSON.parse(await readFile(resolve(directory, 'reports/mutation/mocha/summary.json'), 'utf8'));
	assert.equal(summary.status, 'complete');
	assert.equal(summary.gate, 'failed');
	assert.ok(summary.survivors.some(({ coveringTests }) => coveringTests.some(({ name }) => name.includes('checks the boundary'))));
	await assert.rejects(run(directory, ...args, '--testFiles', 'src/missing.tests.ts'), { code: 3 });
	summary = JSON.parse(await readFile(resolve(directory, 'reports/mutation/mocha/summary.json'), 'utf8'));
	assert.equal(summary.status, 'failed');
	assert.equal(summary.score, null);
	// Automatic discovery must still run Mocha when the same package's Jest config fails.
	await assert.rejects(run(directory, ...args.slice(2)), (error) => {
		assert.equal(error.code, 3);
		assert.match(error.stdout + error.stderr, /Invalid Jest fixture configuration/);
		return true;
	});
	const jestSummary = JSON.parse(await readFile(resolve(directory, 'reports/mutation/jest/summary.json'), 'utf8'));
	assert.equal(jestSummary.status, 'failed');
	assert.equal(jestSummary.testRunner, 'jest');
	summary = JSON.parse(await readFile(resolve(directory, 'reports/mutation/mocha/summary.json'), 'utf8'));
	assert.equal(summary.status, 'complete');
	assert.equal(summary.testRunner, 'mocha');
	assert.equal(await readFile(resolve(directory, 'src/isPositive.ts'), 'utf8'), source);
});

test('invalid wrapper arguments fail before creating mutation reports', async (t) => {
	const directory = await fixture(t);
	for (const args of [
		['--min-score', '101'],
		['--min-score', 'NaN'],
		['--min-score', '80', '--dryRunOnly'],
		['--diff'],
		['--inPlace'],
		['--testRunner', 'unknown'],
		['--testRunner', 'mocha'],
	]) {
		await assert.rejects(run(directory, ...args), { code: 2 });
	}
	await assert.rejects(readFile(resolve(directory, 'reports/mutation/jest/summary.json')), { code: 'ENOENT' });
});

test('diff CLI discovers Jest, Mocha, and mixed workspaces and preserves separate reports', async (t) => {
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
		'scripts/mutation-jest-environment.cjs',
		'scripts/mutation-target-reporter.mjs',
	])
		await copyFile(resolve(root, file), resolve(directory, file));
	const beforeSource =
		'export const positive = (n: number) => n > 0;\nexport const untouched = () => false;\nexport const negative = (n: number) => n < 0;\n';
	const afterSource =
		'export const positive = (n: number) => 0 < n;\nexport const untouched = () => false;\nexport const negative = (n: number) => 0 > n;\n';
	const packages = ['first', 'second', 'mocha-only'];
	const requireMeteor = createRequire(resolve(root, 'apps/meteor/package.json'));
	for (const pkg of packages) {
		await write(`packages/${pkg}/package.json`, '{}');
		await write(`packages/${pkg}/src/example.ts`, beforeSource);
		if (pkg !== 'mocha-only') {
			await write(
				`packages/${pkg}/jest.config.ts`,
				`import server from '@rocket.chat/jest-presets/server'; export default { preset: server.preset, testMatch: ['<rootDir>/src/*.spec.ts'] };`,
			);
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
		if (pkg !== 'first') {
			await write(
				`packages/${pkg}/.mocharc.js`,
				`module.exports = ${JSON.stringify({
					require: [requireMeteor.resolve('tsx')],
					extension: ['ts'],
					spec: ['src/*.tests.ts'],
				})};`,
			);
			await write(
				`packages/${pkg}/src/example.tests.ts`,
				`
import assert from 'node:assert/strict';
import { it } from 'mocha';
import { positive, negative } from './example';
for (const n of [-1, 0, 1]) {
  it('checks boundaries for ' + n, () => {
    assert.equal(positive(n), n === 1);
    assert.equal(negative(n), n === -1);
  });
}
`,
			);
		}
	}
	await git('init', '-q');
	await git('config', 'user.email', 'mutation-fixture@example.invalid');
	await git('config', 'user.name', 'Mutation fixture');
	await git('config', 'commit.gpgsign', 'false');
	await git('config', 'core.hooksPath', '/dev/null');
	await git('add', '.');
	await git('commit', '-qm', 'Fixture baseline');
	await git('branch', 'base');
	for (const pkg of packages) await write(`packages/${pkg}/src/example.ts`, afterSource);
	const statusBefore = await git('status', '--porcelain');
	const { stdout: preview } = await exec(process.execPath, ['scripts/run-mutation-tests.mjs', '--diff', '--base', 'base', '--plan'], {
		cwd: directory,
	});
	const jobs = [
		{ packagePath: 'packages/first', testRunner: 'jest', targets: ['src/example.ts:1-1', 'src/example.ts:3-3'] },
		{ packagePath: 'packages/mocha-only', testRunner: 'mocha', targets: ['src/example.ts:1-1', 'src/example.ts:3-3'] },
		{ packagePath: 'packages/second', testRunner: 'jest', targets: ['src/example.ts:1-1', 'src/example.ts:3-3'] },
		{ packagePath: 'packages/second', testRunner: 'mocha', targets: ['src/example.ts:1-1', 'src/example.ts:3-3'] },
	];
	assert.deepEqual(JSON.parse(preview).jobs, jobs);
	for (const { packagePath, testRunner } of jobs) {
		await assert.rejects(readFile(resolve(directory, packagePath, `reports/mutation/${testRunner}/summary.json`)), { code: 'ENOENT' });
	}
	await exec(process.execPath, ['scripts/run-mutation-tests.mjs', '--diff', '--base', 'base', '--reporters', 'clear-text,html'], {
		cwd: directory,
		timeout: 60_000,
	});
	for (const { packagePath, testRunner } of jobs) {
		const summary = JSON.parse(await readFile(resolve(directory, packagePath, `reports/mutation/${testRunner}/summary.json`), 'utf8'));
		assert.equal(summary.status, 'complete');
		assert.equal(summary.testRunner, testRunner);
		assert.equal(summary.score, 100);
		assert.deepEqual(summary.targets, ['src/example.ts:1-1', 'src/example.ts:3-3']);
		assert.equal(await readFile(resolve(directory, packagePath, 'src/example.ts'), 'utf8'), afterSource);
	}
	const reports = jobs.flatMap(({ packagePath, testRunner }) =>
		['mutation.json', 'mutation.html', 'summary.json'].map((file) => resolve(directory, packagePath, 'reports/mutation', testRunner, file)),
	);
	const reportContents = await Promise.all(reports.map((file) => readFile(file)));
	for (const args of [
		['--diff', '--base', 'base', '--version'],
		['--diff', '--base', 'missing-base', '-V'],
		['--version'],
		['packages/first', '-V'],
	]) {
		const { stdout } = await exec(process.execPath, ['scripts/run-mutation-tests.mjs', ...args], {
			cwd: directory,
			timeout: 10_000,
		});
		assert.match(stdout.trim(), /^\d+\.\d+\.\d+[^\s]*$/);
		assert.deepEqual(await Promise.all(reports.map((file) => readFile(file))), reportContents);
	}
	const jestReports = reports.filter((file) => file.includes('/jest/'));
	const jestContents = await Promise.all(jestReports.map((file) => readFile(file)));
	await exec(
		process.execPath,
		['scripts/run-mutation-tests.mjs', '--diff', '--base', 'base', '--testRunner', 'mocha', '--min-score', '100'],
		{
			cwd: directory,
			timeout: 60_000,
		},
	);
	assert.deepEqual(await Promise.all(jestReports.map((file) => readFile(file))), jestContents);
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
	const summary = JSON.parse(await readFile(resolve(directory, 'reports/mutation/jest/summary.json'), 'utf8'));
	assert.equal(summary.status, 'failed');
	assert.equal(summary.signal, 'SIGTERM');
	assert.equal(summary.score, null);
	assert.equal(await readFile(resolve(directory, 'src/isPositive.ts'), 'utf8'), source);
});
