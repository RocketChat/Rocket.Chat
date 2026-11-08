#!/usr/bin/env node
import { execFileSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const toolRoot = path.resolve(__dirname, '..');
const packageDir = process.cwd();

const args = process.argv.slice(2);
const updateSnapshots = args.includes('--update-snapshots') ? '--update-snapshots' : '';

const runPlaywrightScript = path.join(toolRoot, 'scripts', 'run-playwright-docker.sh');

if (process.env.CI) {
	execFileSync(
		'yarn',
		[
			'dlx',
			'concurrently',
			'-k',
			'-s',
			'first',
			'-n',
			'SB,TEST',
			'yarn dlx http-server storybook-static -s -p 6006',
			`yarn dlx wait-on tcp:127.0.0.1:6006 && sh ${JSON.stringify(runPlaywrightScript)}${updateSnapshots ? ` ${updateSnapshots}` : ''}`,
		],
		{
			stdio: 'inherit',
			cwd: packageDir,
			env: { ...process.env, PACKAGE_DIR: `${packageDir}` },
		},
	);
} else {
	execFileSync(
		'yarn',
		[
			'dlx',
			'concurrently',
			'-k',
			'-s',
			'first',
			'-n',
			'SB,TEST',
			'yarn run build-storybook && yarn dlx http-server storybook-static -s -p 6006',
			`yarn dlx wait-on tcp:127.0.0.1:6006 && sh ${JSON.stringify(runPlaywrightScript)}${updateSnapshots ? ` ${updateSnapshots}` : ''}`,
		],
		{
			stdio: 'inherit',
			cwd: packageDir,
			env: { ...process.env, PACKAGE_DIR: packageDir },
		},
	);
}
