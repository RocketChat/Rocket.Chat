// Runs the Rocket.Chat server and the Vite client together. The browser only
// talks to Vite (PORT, default 3000), which serves the page Meteor renders with
// its own client in it and proxies server routes to Meteor (METEOR_PORT, default 3100).
// With RC_SERVER_URL set, only Vite starts and it proxies to that server instead.
import { spawn, spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { distOnlyWorkspacePackages, publicAssetWorkspacePackages } from './workspacePackages.mjs';

const appRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const workspaceRoot = join(appRoot, '../..');
const require = createRequire(import.meta.url);

const port = process.env.PORT || '3000';
const meteorPort = process.env.METEOR_PORT || '3100';
const remoteServerUrl = process.env.RC_SERVER_URL;
const serverUrl = remoteServerUrl || `http://localhost:${meteorPort}`;

const viteBin = join(dirname(require.resolve('vite/package.json')), 'bin/vite.js');

const isWindows = process.platform === 'win32';

// Each child leads its own process group so stopping it also stops what it spawned (Meteor's app and mongod).
// Windows has no process groups; there the tree is stopped with taskkill instead.
const run = (command, args, env) =>
	spawn(command, args, { cwd: appRoot, stdio: 'inherit', detached: !isWindows, shell: isWindows, env: { ...process.env, ...env } });

const stopTree = (child) => {
	if (isWindows) {
		spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
		return;
	}
	process.kill(-child.pid, 'SIGTERM');
};

// The client compiles workspace packages from source, so against a remote server only the packages it reads from
// dist are built; the local Meteor server still loads every package from dist.
const buildFilters = remoteServerUrl
	? [...distOnlyWorkspacePackages, ...publicAssetWorkspacePackages].map((name) => `--filter=${name}...`)
	: ['--filter=@rocket.chat/meteor^...'];
const build = spawnSync('yarn', ['turbo', 'run', 'build', ...buildFilters], { cwd: workspaceRoot, stdio: 'inherit', shell: isWindows });
if (build.status !== 0) {
	process.exit(build.status ?? 1);
}

// A client built for production (`yarn build:client`) would make the local server add it to the page next to Vite's.
if (!remoteServerUrl) {
	rmSync(join(appRoot, 'public/bundle'), { recursive: true, force: true });
	rmSync(join(appRoot, 'private/vite-manifest.json'), { force: true });
}

const children = [
	!remoteServerUrl &&
		run('meteor', ['run', '--port', meteorPort, '--exclude-archs', 'web.browser.legacy,web.cordova'], {
			// Links the server builds (emails, OAuth callbacks, Site_Url) point at the Vite origin.
			ROOT_URL: process.env.ROOT_URL || `http://localhost:${port}`,
		}),
	run(process.execPath, [viteBin, '--config', join(appRoot, 'vite/vite.config.mts')], {
		PORT: port,
		RC_SERVER_URL: serverUrl,
		RC_DEV_SERVER_PAGE: remoteServerUrl ? '' : '1',
	}),
].filter(Boolean);

let stopping = false;
const stopAll = (code = 0) => {
	if (stopping) return;
	stopping = true;
	process.exitCode = code;
	for (const child of children) {
		try {
			stopTree(child);
		} catch {
			// already gone
		}
	}
};

for (const child of children) {
	child.on('exit', (code, signal) => stopAll(code ?? (signal ? 1 : 0)));
}

process.on('SIGINT', () => stopAll());
process.on('SIGTERM', () => stopAll());
