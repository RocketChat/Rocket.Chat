#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const net = require('net');

const processes = [];
let exitCode;

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
			console.log('Port', port, 'not release, waiting 1s...');
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

function startProcess(opts) {
	const proc = spawn(opts.command, opts.params, opts.options);

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
		if (code != null) {
			exitCode = code;
			console.log(opts.name, `exited with code ${code}`);
		} else {
			console.log(opts.name, `exited with signal ${signal}`);
		}

		processes.splice(processes.indexOf(proc), 1);

		processes.forEach((p) => {
			console.log('Killing process', p.pid);
			p.kill();
		});

		if (processes.length === 0) {
			waitPortRelease(appOptions.env.PORT)
				.then(() => {
					console.log(`Port ${appOptions.env.PORT} was released, exiting with code ${exitCode}`);
					process.exit(exitCode);
				})
				.catch((error) => {
					console.error(`Error waiting port ${appOptions.env.PORT} to be released, exiting with code ${exitCode}`);
					console.error(error);
					process.exit(exitCode);
				});
		}
	});
	processes.push(proc);
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

function startMicroservices() {
	return new Promise((resolve) => {
		const servicesDir = path.resolve(srcDir, 'ee', 'server', 'services');

		const waitStart = (message) => {
			if (message.toString().match('started successfully')) {
				return resolve();
			}
		};

		const startService = (name) => {
			startProcess({
				name: `${name} service`,
				command: 'npm',
				params: ['run', `start:${name}`],
				...(name === 'ddp-streamer' && { onData: waitStart }),
				options: {
					cwd: servicesDir,
					env: {
						...appOptions.env,
						...process.env,
					},
				},
			});
		};

		startService('account');
		startService('authorization');
		startService('ddp-streamer');
		startService('presence');
		startService('stream-hub');
	});
}

function startChimp() {
	startProcess({
		name: 'Chimp',
		command: 'npm',
		params: ['test'],
		options: {
			env: {
				...process.env,
				NODE_PATH: `${process.env.NODE_PATH + path.delimiter + srcDir + path.delimiter + srcDir}/node_modules`,
			},
		},
	});
}

(async () => {
	const [, , options = ''] = process.argv;

	await startRocketChat();

	if (options === '--enterprise') {
		await startMicroservices();
	}

	startChimp();
})();
