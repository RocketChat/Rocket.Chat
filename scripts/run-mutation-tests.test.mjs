import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
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
const source = 'export const isPositive = (value: number) => value > 0;';
const repo = (directory) => resolve(directory, '../..');
const git = async (directory, ...args) => (await exec('git', args, { cwd: repo(directory) })).stdout;
const write = async (directory, name, content) => {
	const path = resolve(directory, name);
	await mkdir(dirname(path), { recursive: true });
	await writeFile(path, content);
};

async function fixture(t, config = clientConfig) {
	await mkdir(resolve(root, '.stryker-tmp'), { recursive: true });
	const repository = await mkdtemp(resolve(root, '.stryker-tmp/tooling-test-'));
	t.after(() => rm(repository, { recursive: true, force: true }));
	const directory = resolve(repository, 'packages/example');
	await symlink(resolve(root, 'node_modules'), resolve(repository, 'node_modules'), 'dir');
	await write(repository, 'package.json', JSON.stringify({ workspaces: ['packages/*'] }));
	await write(repository, '.gitignore', 'node_modules\n.stryker-tmp\nreports\n');
	await mkdir(resolve(repository, 'scripts'));
	for (const file of [
		'stryker.config.mjs',
		'scripts/run-mutation-tests.mjs',
		'scripts/mutation-worker.mjs',
		'scripts/mutation-diff.mjs',
		'scripts/mutation-jest-config.mjs',
		'scripts/mutation-jest-environment.cjs',
	])
		await copyFile(resolve(root, file), resolve(repository, file));
	await write(directory, 'package.json', '{}');
	await write(directory, 'jest.config.ts', config);
	await write(directory, 'src/isPositive.ts', source.replace('> 0', '>= 0'));
	await write(
		directory,
		'src/isPositive.spec.ts',
		`
import { createElement } from 'react';
import { isPositive } from 'local';
test.each([-1, 0, 1])('checks the boundary for %s', (value) => {
  expect(isPositive(value)).toBe(value === 1);
  expect(createElement('div').type).toBe('div');
  expect(document.createElement('div').tagName).toBe('DIV');
});
`,
	);
	await git(directory, 'init', '-q');
	await git(directory, 'config', 'user.email', 'mutation-fixture@example.invalid');
	await git(directory, 'config', 'user.name', 'Mutation fixture');
	await git(directory, 'config', 'commit.gpgsign', 'false');
	await git(directory, 'config', 'core.hooksPath', '/dev/null');
	await git(directory, 'add', '.');
	await git(directory, 'commit', '-qm', 'Fixture baseline');
	await git(directory, 'update-ref', 'refs/remotes/origin/develop', 'HEAD');
	await write(directory, 'src/isPositive.ts', source);
	return directory;
}

function run(directory, ...args) {
	return exec(process.execPath, ['scripts/run-mutation-tests.mjs', ...(args.length ? args : ['--diff'])], {
		cwd: repo(directory),
		timeout: 60_000,
	});
}

async function report(directory, runner = 'jest') {
	return JSON.parse(await readFile(resolve(directory, `reports/mutation/${runner}/mutation.json`), 'utf8'));
}

test('diff preserves preset jsdom and external aliases while local aliases exercise mutants', async (t) => {
	const directory = await fixture(t);
	const before = await git(directory, 'status', '--porcelain');
	await run(directory);
	const { mutants } = (await report(directory)).files['src/isPositive.ts'];
	assert.ok(mutants.length > 0);
	assert.ok(
		mutants.every(({ status }) => status === 'Killed'),
		JSON.stringify(mutants),
	);
	assert.ok((await readFile(resolve(directory, 'reports/mutation/jest/mutation.html'), 'utf8')).length > 0);
	assert.equal(await readFile(resolve(directory, 'src/isPositive.ts'), 'utf8'), source);
	assert.equal(await git(directory, 'status', '--porcelain'), before);
});

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
	await run(directory).catch((error) => assert.fail(error.stdout + error.stderr));
	const report = JSON.parse(await readFile(resolve(directory, 'reports/mutation/jest/mutation.json'), 'utf8'));
	for (const file of ['src/isPositive.ts', 'src/isNegative.ts']) {
		assert.ok(report.files[file].mutants.length > 0);
		assert.ok(report.files[file].mutants.every(({ status }) => status === 'Killed'));
	}
	assert.equal(await readFile(resolve(directory, 'src/isPositive.ts'), 'utf8'), source);
});

test('rejects Jest projects with different roots explicitly', async (t) => {
	const directory = await fixture(t, `export default { projects: [{ rootDir: '.' }, { rootDir: './src' }] };`);
	await assert.rejects(run(directory), (error) => {
		assert.equal(error.code, 3);
		assert.match(error.stdout + error.stderr, /inline Jest projects sharing the package root/);
		return true;
	});
});

test('survivors are reported without failing the command', async (t) => {
	const directory = await fixture(t);
	await write(
		directory,
		'src/isPositive.spec.ts',
		`
import { isPositive } from 'local';
test('positive input', () => expect(isPositive(1)).toBe(true));
`,
	);
	await run(directory);
	assert.ok((await report(directory)).files['src/isPositive.ts'].mutants.some(({ status }) => status === 'Survived'));
});

test('baseline failures remove stale reports and leave source unchanged', async (t) => {
	const directory = await fixture(t);
	for (const file of ['mutation.json', 'mutation.html']) await write(directory, `reports/mutation/jest/${file}`, 'old report');
	await write(directory, 'src/isPositive.spec.ts', 'test("broken baseline", () => expect(false).toBe(true));');
	await assert.rejects(run(directory), { code: 3 });
	for (const file of ['mutation.json', 'mutation.html']) {
		await assert.rejects(readFile(resolve(directory, 'reports/mutation/jest', file)), { code: 'ENOENT' });
	}
	assert.equal(await readFile(resolve(directory, 'src/isPositive.ts'), 'utf8'), source);
});

test('test-only changes skip mutation testing and preserve existing reports', async (t) => {
	const directory = await fixture(t);
	await git(directory, 'restore', 'packages/example/src/isPositive.ts');
	await write(directory, 'src/isPositive.spec.ts', 'test("test-only change", () => {});');
	await write(directory, 'reports/mutation/jest/mutation.html', 'previous report');
	const { stdout } = await run(directory);
	assert.match(stdout, /No changed production lines to mutation-test\./);
	assert.doesNotMatch(stdout, /Starting initial test run/);
	assert.equal(await readFile(resolve(directory, 'reports/mutation/jest/mutation.html'), 'utf8'), 'previous report');
});

test('unsupported arguments fail before touching reports', async (t) => {
	const directory = await fixture(t);
	for (const args of [['--diff', '--plan'], ['packages/example'], ['--diff', '--mutate', 'src/isPositive.ts']]) {
		await assert.rejects(run(directory, ...args), { code: 2 });
	}
	await assert.rejects(readFile(resolve(directory, 'reports/mutation/jest/mutation.json')), { code: 'ENOENT' });
});

test('SIGTERM cancels without altering source or starting the next runner', { timeout: 30_000 }, async (t) => {
	const directory = await fixture(t);
	await write(directory, '.mocharc.js', 'module.exports = {};');
	await write(
		directory,
		'src/isPositive.spec.ts',
		`
import { isPositive } from 'local';
test('slow baseline', async () => {
  await new Promise((resolve) => setTimeout(resolve, 10000));
  expect(isPositive(1)).toBe(true);
}, 20000);
`,
	);
	const child = spawn(process.execPath, ['scripts/run-mutation-tests.mjs', '--diff'], {
		cwd: repo(directory),
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
	assert.doesNotMatch(output, /example \(mocha\)/);
	assert.equal(await readFile(resolve(directory, 'src/isPositive.ts'), 'utf8'), source);
});
test('diff CLI discovers Jest, Mocha, and mixed workspaces and preserves separate reports', async (t) => {
	const packageDirectory = await fixture(t);
	const directory = repo(packageDirectory);
	const write = async (file, text) => {
		await mkdir(dirname(resolve(directory, file)), { recursive: true });
		await writeFile(resolve(directory, file), text);
	};
	const git = async (...args) => (await exec('git', args, { cwd: directory })).stdout;
	await rm(packageDirectory, { recursive: true });
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
	await git('add', '.');
	await git('commit', '-qm', 'Fixture workspace baseline');
	await git('update-ref', 'refs/remotes/origin/develop', 'HEAD');
	for (const pkg of packages) await write(`packages/${pkg}/src/example.ts`, afterSource);
	const statusBefore = await git('status', '--porcelain');
	const jobs = [
		{ packagePath: 'packages/first', testRunner: 'jest', targets: ['src/example.ts:1-1', 'src/example.ts:3-3'] },
		{ packagePath: 'packages/mocha-only', testRunner: 'mocha', targets: ['src/example.ts:1-1', 'src/example.ts:3-3'] },
		{ packagePath: 'packages/second', testRunner: 'jest', targets: ['src/example.ts:1-1', 'src/example.ts:3-3'] },
		{ packagePath: 'packages/second', testRunner: 'mocha', targets: ['src/example.ts:1-1', 'src/example.ts:3-3'] },
	];
	await run(packageDirectory);
	for (const { packagePath, testRunner } of jobs) {
		const result = await report(resolve(directory, packagePath), testRunner);
		const { mutants } = result.files['src/example.ts'];
		assert.ok(mutants.length > 0);
		assert.ok(mutants.every(({ status }) => status === 'Killed'));
		assert.deepEqual([...new Set(mutants.map(({ location }) => location.start.line))].sort(), [1, 3]);
		assert.equal(await readFile(resolve(directory, packagePath, 'src/example.ts'), 'utf8'), afterSource);
		assert.ok((await readFile(resolve(directory, packagePath, 'reports/mutation', testRunner, 'mutation.html'))).length > 0);
	}
	assert.equal(await git('status', '--porcelain'), statusBefore);
	// A failed Jest job must not prevent Mocha from completing, or hide the overall failure.
	await write('packages/second/jest.config.ts', "throw new Error('Invalid Jest fixture configuration'); export default {};");
	await assert.rejects(run(packageDirectory), (error) => {
		assert.equal(error.code, 3);
		assert.match(error.stdout + error.stderr, /Invalid Jest fixture configuration/);
		return true;
	});
	const mocha = await report(resolve(directory, 'packages/second'), 'mocha');
	assert.ok(mocha.files['src/example.ts'].mutants.every(({ status }) => status === 'Killed'));
});
