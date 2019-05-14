#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const extend = require('util')._extend;
const { spawn } = require('child_process');
const net = require('net');

const processes = [];
let exitCode;

const baseDir = path.resolve(__dirname, '..');
const srcDir = path.resolve(baseDir);

const isPortTaken = (port) => new Promise((resolve, reject) => {
	const tester = net.createServer()
		.once('error', (err) => (err.code === 'EADDRINUSE' ? resolve(true) : reject(err)))
		.once('listening', () => tester.once('close', () => resolve(false)).close())
		.listen(port);
});

const waitPortRelease = (port) => new Promise((resolve, reject) => {
	isPortTaken(port).then((taken) => {
		if (!taken) {
			return resolve();
		}
		setTimeout(() => {
			waitPortRelease(port).then(resolve).catch(reject);
		}, 1000);
	});
});

const appOptions = {
	env: {
		PORT: 3000,
		ROOT_URL: 'http://localhost:3000',
		// MONGO_URL: 'mongodb://localhost:27017/test',
		// MONGO_OPLOG_URL: 'mongodb://localhost:27017/local',
	},
};

function startProcess(opts, callback) {
	const proc = spawn(
		opts.command,
		opts.params,
		opts.options
	);

	if (opts.waitForMessage) {
		proc.stdout.on('data', function waitForMessage(data) {
			if (data.toString().match(opts.waitForMessage)) {
				if (callback) {
					callback();
				}
			}
		});
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

	proc.on('exit', function(code, signal) {
		if (code != null) {
			exitCode = code;
			console.log(opts.name, `exited with code ${ code }`);
		} else {
			console.log(opts.name, `exited with signal ${ signal }`);
		}

		processes.splice(processes.indexOf(proc), 1);

		processes.forEach((p) => p.kill());

		if (processes.length === 0) {
			waitPortRelease(appOptions.env.PORT).then(() => {
				console.log(`Port ${ appOptions.env.PORT } was released, exiting with code ${ exitCode }`);
				process.exit(exitCode);
			}).catch((error) => {
				console.error(`Error waiting port ${ appOptions.env.PORT } to be released, exiting with code ${ exitCode }`);
				console.error(error);
				process.exit(exitCode);
			});
		}
	});
	processes.push(proc);
}

function startApp(callback) {
	startProcess({
		name: 'Meteor App',
		command: 'node',
		params: ['/tmp/build-test/bundle/main.js'],
		// command: 'node',
		// params: ['.meteor/local/build/main.js'],
		waitForMessage: appOptions.waitForMessage,
		options: {
			cwd: srcDir,
			env: extend(appOptions.env, process.env),
		},
	}, callback);
}

function startChimp() {
	startProcess({
		name: 'Chimp',
		command: 'npm',
		params: ['run', 'chimp-test'],
		// command: 'exit',
		// params: ['2'],
		options: {
			env: Object.assign({}, process.env, {
				NODE_PATH: `${ process.env.NODE_PATH
					+ path.delimiter + srcDir
					+ path.delimiter + srcDir }/node_modules`,
			}),
		},
	});
}

function chimpNoMirror() {
	appOptions.waitForMessage = 'SERVER RUNNING';
	startApp(function() {
		startChimp();
	});
}

chimpNoMirror();
