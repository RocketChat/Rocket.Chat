// Runs the Rocket.Chat server and the Vite client together. The browser only
// talks to Vite (PORT, default 3000), which proxies server routes to Meteor
// (METEOR_PORT, default 3100). Meteor skips its own client build.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

const port = process.env.PORT || '3000';
const meteorPort = process.env.METEOR_PORT || '3100';
const serverUrl = `http://localhost:${meteorPort}`;

const viteBin = join(dirname(require.resolve('vite/package.json')), 'bin/vite.js');

// Each child leads its own process group so stopping it also stops what it spawned (Meteor's app and mongod).
const run = (command, args, env) =>
	spawn(command, args, { cwd: appRoot, stdio: 'inherit', detached: true, env: { ...process.env, ...env } });

const children = [
	run('meteor', ['run', '--port', meteorPort, '--exclude-archs', 'web.browser,web.browser.legacy,web.cordova'], {
		// Links the server builds (emails, OAuth callbacks, Site_Url) point at the Vite origin.
		ROOT_URL: process.env.ROOT_URL || `http://localhost:${port}`,
	}),
	run(process.execPath, [viteBin, '--config', join(appRoot, 'vite/vite.config.mts')], { PORT: port, RC_SERVER_URL: serverUrl }),
];

let stopping = false;
const stopAll = (code = 0) => {
	if (stopping) return;
	stopping = true;
	process.exitCode = code;
	for (const child of children) {
		try {
			process.kill(-child.pid, 'SIGTERM');
		} catch {
			// already gone
		}
	}
};

for (const child of children) {
	child.on('exit', (code) => stopAll(code ?? 0));
}

process.on('SIGINT', () => stopAll());
process.on('SIGTERM', () => stopAll());
