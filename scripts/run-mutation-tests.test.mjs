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

async function commandFixture(t, worker = "throw new Error('Unexpected worker execution');") {
	await mkdir(resolve(root, '.stryker-tmp'), { recursive: true });
	const repository = await mkdtemp(resolve(root, '.stryker-tmp/tooling-test-'));
	t.after(() => rm(repository, { recursive: true, force: true }));
	const directory = resolve(repository, 'packages/example');
	await write(repository, 'package.json', JSON.stringify({ workspaces: ['packages/*'] }));
	await mkdir(resolve(repository, 'scripts'));
	for (const file of ['scripts/run-mutation-tests.mjs', 'scripts/mutation-diff.mjs'])
		await copyFile(resolve(root, file), resolve(repository, file));
	await write(repository, 'scripts/mutation-worker.mjs', worker);
	await write(directory, 'package.json', '{}');
	await write(directory, 'jest.config.ts', 'export default {};');
	return directory;
}

async function fixture(t, config = clientConfig) {
	const directory = await commandFixture(t);
	const repository = repo(directory);
	await symlink(resolve(root, 'node_modules'), resolve(repository, 'node_modules'), 'dir');
	await write(repository, '.gitignore', 'node_modules\n.stryker-tmp\nreports\n');
	for (const file of [
		'stryker.config.mjs',
		'scripts/mutation-worker.mjs',
		'scripts/mutation-jest-config.mjs',
		'scripts/mutation-jest-environment.cjs',
	])
		await copyFile(resolve(root, file), resolve(repository, file));
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
	await run(directory).catch((error) => assert.fail(error.stdout + error.stderr));
	const result = await report(directory);
	for (const file of ['src/isPositive.ts', 'src/isNegative.ts']) {
		assert.ok(result.files[file].mutants.length > 0);
		assert.ok(result.files[file].mutants.every(({ status }) => status === 'Killed'));
	}
});

test('rejects Jest projects with different roots explicitly', async (t) => {
	const directory = await fixture(t, `export default { projects: [{ rootDir: '.' }, { rootDir: './src' }] };`);
	await assert.rejects(run(directory), (error) => {
		assert.equal(error.code, 3);
		assert.match(error.stdout + error.stderr, /inline Jest projects sharing the package root/);
		return true;
	});
});

test('baseline failures remove stale reports and leave source unchanged', async (t) => {
	const directory = await fixture(t);
	for (const file of ['mutation.json', 'mutation.html']) await write(directory, `reports/mutation/jest/${file}`, 'old report');
	await write(
		directory,
		'src/isPositive.spec.ts',
		`import { isPositive } from 'local';
test('broken baseline', () => expect(isPositive(1)).toBe(false));`,
	);
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

test('explicit selection checks unchanged code without a Git base and reports survivors without failing', async (t) => {
	const directory = await fixture(t);
	await git(directory, 'add', 'packages/example/src/isPositive.ts');
	await git(directory, 'commit', '-qm', 'Fixture correct production code');
	await git(directory, 'update-ref', '-d', 'refs/remotes/origin/develop');
	await write(
		directory,
		'src/isPositive.spec.ts',
		`
import { isPositive } from 'local';
test('positive input', () => expect(isPositive(1)).toBe(true));
`,
	);
	await run(directory, 'packages/example', '--mutate', 'src/isPositive.ts');
	const { mutants } = (await report(directory)).files['src/isPositive.ts'];
	assert.ok(mutants.some(({ status }) => status === 'Killed'));
	assert.ok(mutants.some(({ status }) => status === 'Survived'));
	assert.equal(await readFile(resolve(directory, 'src/isPositive.ts'), 'utf8'), source);
});

test('unsupported arguments fail before touching reports', async (t) => {
	const directory = await commandFixture(t);
	for (const args of [['--diff', '--plan'], ['packages/example'], ['--diff', '--mutate', 'src/isPositive.ts']]) {
		await assert.rejects(run(directory, ...args), { code: 2 });
	}
	await assert.rejects(readFile(resolve(directory, 'reports/mutation/jest/mutation.json')), { code: 'ENOENT' });
});

test('runner failures set the command exit code while allowing the next runner to finish', async (t) => {
	const directory = await commandFixture(
		t,
		`console.log('worker: ' + process.argv[2]); process.exitCode = process.argv[2] === 'jest' ? 3 : 0;`,
	);
	await write(directory, '.mocharc.js', 'module.exports = {};');
	await assert.rejects(run(directory, 'packages/example', '--mutate', 'src/isPositive.ts'), (error) => {
		assert.equal(error.code, 3);
		assert.match(error.stdout, /worker: jest[\s\S]*worker: mocha/);
		return true;
	});
});

test('SIGTERM reaches the worker and cancels without starting the next runner', { timeout: 10_000 }, async (t) => {
	const directory = await commandFixture(
		t,
		`
process.on('SIGTERM', () => { console.log('worker stopped'); process.exit(0); });
setInterval(() => {}, 1000);
console.log('worker ready');
`,
	);
	await write(directory, '.mocharc.js', 'module.exports = {};');
	const child = spawn(process.execPath, ['scripts/run-mutation-tests.mjs', 'packages/example', '--mutate', 'src/isPositive.ts'], {
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
		if (!cancelled && output.includes('worker ready')) {
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
	assert.match(output, /worker stopped/);
	assert.doesNotMatch(output, /example \(mocha\)/);
});

test('diff runs Jest and Mocha on selected lines, preserving aliases, environments, and separate reports', async (t) => {
	const directory = await fixture(t);
	const requireMeteor = createRequire(resolve(root, 'apps/meteor/package.json'));
	await write(
		directory,
		'.mocharc.js',
		`module.exports = ${JSON.stringify({
			require: [requireMeteor.resolve('tsx')],
			extension: ['ts'],
			spec: ['src/*.tests.ts'],
		})};`,
	);
	await write(
		directory,
		'src/isPositive.tests.ts',
		`
import assert from 'node:assert/strict';
import { it } from 'mocha';
import { isPositive, isNegative } from './isPositive';
for (const value of [-1, 0, 1]) {
  it('checks the boundary for ' + value, () => {
    assert.equal(isPositive(value), value === 1);
    assert.equal(isNegative(value), value === -1);
  });
}
`,
	);
	await write(
		directory,
		'src/isPositive.spec.ts',
		`${await readFile(resolve(directory, 'src/isPositive.spec.ts'), 'utf8')}
import { isNegative } from './isPositive';
test.each([-1, 0, 1])('checks negative boundary for %s', (value) => expect(isNegative(value)).toBe(value === -1));
`,
	);
	const before = `${source}\nexport const untouched = () => false;\nexport const isNegative = (value: number) => value < 0;`;
	const after = before.replaceAll('value', 'input');
	await write(directory, 'src/isPositive.ts', before);
	await git(directory, 'add', '.');
	await git(directory, 'commit', '-qm', 'Fixture mixed runners');
	await git(directory, 'update-ref', 'refs/remotes/origin/develop', 'HEAD');
	await write(directory, 'src/isPositive.ts', after);
	await run(directory);
	for (const runner of ['jest', 'mocha']) {
		const { mutants } = (await report(directory, runner)).files['src/isPositive.ts'];
		assert.deepEqual([...new Set(mutants.map(({ location }) => location.start.line))].sort(), [1, 3]);
		assert.ok(
			mutants.every(({ status }) => status === 'Killed'),
			JSON.stringify(mutants),
		);
		assert.ok((await readFile(resolve(directory, 'reports/mutation', runner, 'mutation.html'))).length > 0);
	}
	assert.equal(await readFile(resolve(directory, 'src/isPositive.ts'), 'utf8'), after);

	await write(directory, 'jest.config.ts', "export default { testMatch: ['<rootDir>/missing/**/*.spec.ts'] };");
	await rm(resolve(directory, 'reports/mutation/mocha'), { recursive: true });
	const { stdout } = await run(directory);
	assert.match(stdout, /No tests were found/);
	await assert.rejects(report(directory), { code: 'ENOENT' });
	const { mutants } = (await report(directory, 'mocha')).files['src/isPositive.ts'];
	assert.ok(mutants.length > 0 && mutants.every(({ status }) => status === 'Killed'));
});
