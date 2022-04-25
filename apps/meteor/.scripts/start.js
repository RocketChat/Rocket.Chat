#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const net = require('net');

const processes = [];

const baseDir = path.resolve(__dirname, '..');
const srcDir = path.resolve(baseDir);

const isPortTaken = (port) =>
	new Promise((resolve, reject) => {
		const tester = net
			.createServer()
			.once('error', (err) => (err.code === 'EADDRINUSE' ? resolve(true) : reject(err)))
			.once('listening', () => tester.once('close', () => resolve(false)).close())
			.listen(port);
	});

const waitPortRelease = (port, count = 0) =>
	new Promise((resolve, reject) => {
		isPortTaken(port).then((taken) => {
			if (!taken) {
				return resolve();
			}
			if (count > 60) {
				return reject();
			}
			console.log('Port', port, 'not released, waiting 1s...');
			setTimeout(() => {
				waitPortRelease(port, ++count)
					.then(resolve)
					.catch(reject);
			}, 1000);
		});
	});

const appOptions = {
	env: {
		PORT: 3000,
		ROOT_URL: 'http://localhost:3000',
	},
};

let killingAllProcess = false;
function killAllProcesses(mainExitCode) {
	if (killingAllProcess) {
		return;
	}
	killingAllProcess = true;

	processes.forEach((p) => {
		console.log('Killing process', p.pid);
		p.kill();
	});

	waitPortRelease(appOptions.env.PORT)
		.then(() => {
			console.log(`Port ${appOptions.env.PORT} was released, exiting with code ${mainExitCode}`);
			process.exit(mainExitCode);
		})
		.catch((error) => {
			console.error(`Error waiting port ${appOptions.env.PORT} to be released, exiting with code ${mainExitCode}`);
			console.error(error);
			process.exit(mainExitCode);
		});
}

function startProcess(opts) {
	console.log('Starting process', opts.name, opts.command, opts.params, opts.options.cwd);
	const proc = spawn(opts.command, opts.params, opts.options);
	processes.push(proc);

	if (opts.onData) {
		proc.stdout.on('data', opts.onData);
	}

	if (!opts.silent) {
		proc.stdout.pipe(process.stdout);
		proc.stderr.pipe(process.stderr);
	}

	if (opts.logFile) {
		const logStream = fs.createWriteStream(opts.logFile, { flags: 'a' });
		proc.stdout.pipe(logStream);
		proc.stderr.pipe(logStream);
	}

	proc.on('exit', function (code, signal) {
		processes.splice(processes.indexOf(proc), 1);

		if (code != null) {
			console.log(opts.name, `exited with code ${code}`);
		} else {
			console.log(opts.name, `exited with signal ${signal}`);
		}

		killAllProcesses(code);
	});
}

function startRocketChat() {
	return new Promise((resolve) => {
		const waitServerRunning = (message) => {
			if (message.toString().match('SERVER RUNNING')) {
				return resolve();
			}
		};

		startProcess({
			name: 'Meteor App',
			command: 'node',
			params: ['/tmp/build-test/bundle/main.js'],
			onData: waitServerRunning,
			options: {
				cwd: srcDir,
				env: {
					...appOptions.env,
					...process.env,
				},
			},
		});
	});
}

async function startMicroservices() {
	const waitStart = (resolve) => (message) => {
		if (message.toString().match('NetworkBroker started successfully')) {
			return resolve();
		}
	};
	const startService = (name) => {
		return new Promise((resolve) => {
			const cwd =
				name === 'ddp-streamer'
					? path.resolve(srcDir, '..', '..', 'ee', 'apps', name, 'dist', 'ee', 'apps', name)
					: path.resolve(srcDir, 'ee', 'server', 'services', 'dist', 'ee', 'server', 'services', name);

			startProcess({
				name: `${name} service`,
				command: 'node',
				params: [name === 'ddp-streamer' ? 'src/service.js' : 'service.js'],
				onData: waitStart(resolve),
				options: {
					cwd,
					env: {
						...appOptions.env,
						...process.env,
						PORT: 4000,
					},
				},
			});
		});
	};

	await Promise.all([
		startService('account'),
		startService('authorization'),
		startService('ddp-streamer'),
		startService('presence'),
		startService('stream-hub'),
	]);
}

function startTests(options = []) {
	const testOption = options.find((i) => i.startsWith('--test='));
	const testParam = testOption ? testOption.replace('--test=', '') : 'test';

	console.log(`Running test "npm run ${testParam}"`);

	startProcess({
		name: 'Tests',
		command: 'npm',
		params: ['run', testParam],
		options: {
			env: {
				...process.env,
				NODE_PATH: `${process.env.NODE_PATH + path.delimiter + srcDir + path.delimiter + srcDir}/node_modules`,
			},
		},
	});
}

(async () => {
	const [, , ...options] = process.argv;

	await startRocketChat();

	if (options.includes('--enterprise')) {
		await startMicroservices();
	}

	startTests(options);
})();
