const { spawnSync, spawn } = require('node:child_process');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../../..');

const isBypassEnabled = () => {
	const value = (process.env.DEV_DB_BYPASS_MANAGED || '').toLowerCase();
	return value === '1' || value === 'true' || value === 'yes';
};

const runManagedDbUp = () => {
	const cliPath = path.join(repoRoot, 'packages/dev-db/src/cli.ts');
	const tsconfigPath = path.join(repoRoot, 'packages/dev-db/tsconfig.json');

	const result = spawnSync('ts-node', ['--transpile-only', '--project', tsconfigPath, cliPath, 'up', '--json'], {
		cwd: repoRoot,
		env: process.env,
		encoding: 'utf8',
	});

	if (result.status !== 0) {
		const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
		throw new Error(output || 'dev-db up failed');
	}

	const stdout = (result.stdout || '').trim();
	if (!stdout) {
		throw new Error('dev-db up returned no output');
	}

	const payload = JSON.parse(stdout);
	if (!payload.urls?.mongoUrl) {
		throw new Error('dev-db up did not return urls.mongoUrl');
	}

	return payload;
};

const startMeteor = (env) => {
	const meteorArgs = ['--exclude-archs', 'web.browser.legacy, web.cordova'];
	const child = spawn('meteor', meteorArgs, {
		cwd: path.resolve(__dirname, '..'),
		env,
		stdio: 'inherit',
	});

	child.on('exit', (code, signal) => {
		if (signal) {
			process.kill(process.pid, signal);
			return;
		}

		process.exit(code || 0);
	});
};

const main = () => {
	const env = {
		...process.env,
		NODE_OPTIONS: process.env.NODE_OPTIONS || '--trace-warnings',
	};

	if (!isBypassEnabled()) {
		const payload = runManagedDbUp();
		env.MONGO_URL = payload.urls.mongoUrl;
		if (payload.urls.mongoOplogUrl) {
			env.MONGO_OPLOG_URL = payload.urls.mongoOplogUrl;
		}

		console.log(`dev-db selected backend: ${payload.state?.backend || 'unknown'}`);
		console.log(`MONGO_URL: ${env.MONGO_URL}`);
	} else {
		console.log('DEV_DB_BYPASS_MANAGED is enabled; starting Meteor without managed dev-db orchestration.');
	}

	startMeteor(env);
};

main();
