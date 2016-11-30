#!/usr/bin/env node
var path = require('path'),
	 fs = require('fs'),
	 extend = require('util')._extend,
	 exec = require('child_process').exec,
	 processes = [];

var baseDir = path.resolve(__dirname, '..'),
	 srcDir = path.resolve(baseDir),
	 chimpBin = path.resolve(baseDir, '.scripts/node_modules/.bin/chimp'),
	 features = [];

// process.argv.slice(2).forEach(function(featureFile) { features.push(path.resolve(featureFile))});

var appOptions = {
	port: 3000,
	env: {
		ROOT_URL: 'http://localhost:3000'
	}
};

var chimpSwitches = '';

chimpSwitches +=
	 '--path=tests/steps';

chimpNoMirror();

// *************************************************

function chimpNoMirror() {
	appOptions.waitForMessage = 'App running at';
	// startApp(function () {
		// console.log("inside no mirror ", chimpSwitches);
		startChimp();
	// });
}

function startApp(callback) {
	startProcess({
		name: 'Meteor App',
		command: 'meteor --port ' + appOptions.port,
		waitForMessage: appOptions.waitForMessage,
		options: {
			cwd: srcDir,
			env: extend(appOptions.env, process.env)
		}
	}, callback);
}

function startChimp(command) {
	console.log("chimpBin ", chimpBin);
	console.log("command ", command);
	startProcess({
		name: 'Chimp',
		command: 'meteor npm run chimp-test',
		// command: chimpBin + ' ' + command,
		options: {
			env: Object.assign({}, process.env, {
				NODE_PATH: process.env.NODE_PATH +
					path.delimiter + srcDir +
					path.delimiter + srcDir + '/node_modules',
			}),
		},
	});
}

function startProcess(opts, callback) {
	var proc = exec(
		 opts.command,
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
		var logStream = fs.createWriteStream(opts.logFile, {flags: 'a'});
		proc.stdout.pipe(logStream);
		proc.stderr.pipe(logStream);
	}
	proc.on('close', function (code) {
		console.log(opts.name, 'exited with code ' + code);
		for (var i = 0; i < processes.length; i += 1) {
			processes[i].kill();
		}
		process.exit(code);
	});
	processes.push(proc);
}
