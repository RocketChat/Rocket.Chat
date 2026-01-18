const { spawn, execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const meteorHome = path.join(os.homedir(), '.meteor');
const projectRoot = process.cwd();
const dbPath = path.join(projectRoot, '.meteor/local/db');
const mongoPort = 3001;
const mongoUrl = `mongodb://localhost:${mongoPort}/meteor`;
const oplogUrl = `mongodb://localhost:${mongoPort}/local`;

// Ensure db directory exists
if (!fs.existsSync(dbPath)) {
	fs.mkdirSync(dbPath, { recursive: true });
}

// remove lock file if exists, assuming we are restarting clean or previous run crashed
const lockFile = path.join(dbPath, 'mongod.lock');
if (fs.existsSync(lockFile)) {
	try {
		fs.unlinkSync(lockFile);
	} catch (e) {
		// ignore
	}
}

// Find mongod
function findMongod() {
	console.log(`Searching for mongod in ${meteorHome}`);
	// Rough search for mongod binary
	// We try to find the one in meteor-tool
	// This is a naive implementation, might need refinement
	try {
		const cmd = `find ${meteorHome} -name mongod -type f | grep "bin/mongod$" | sort -r | head -n 1`;
		const mongodPath = execSync(cmd).toString().trim();
		if (mongodPath) return mongodPath;
	} catch (e) {
		console.error('Failed to find mongod:', e);
	}
	return null;
}

const mongodPath = findMongod();
if (!mongodPath) {
	console.error('Could not find mongod binary. Make sure Meteor is installed.');
	process.exit(1);
}

console.log(`Found mongod: ${mongodPath}`);

// Start mongod
// mongod --dbpath .meteor/local/db --port 3001 --replSet meteor --bind_ip 127.0.0.1 --oplogSize 128
const mongoArgs = [
	'--dbpath',
	dbPath,
	'--port',
	mongoPort.toString(),
	'--replSet',
	'meteor',
	'--bind_ip',
	'127.0.0.1',
	'--oplogSize',
	'128',
];

console.log('Starting mongod...');
const mongod = spawn(mongodPath, mongoArgs, {
	// stdio: 'inherit' // Pipe output so we see mongo logs
});

let serverProcess = null;

mongod.on('error', (err) => {
	console.error('Failed to start mongod:', err);
	process.exit(1);
});

function cleanup() {
	if (serverProcess) serverProcess.kill();
	if (mongod) {
		console.log('Stopping mongod...');
		mongod.kill();
	}
	process.exit(0);
}

// Wait a bit for mongo to come up and initialize replset if needed
// Actually, if the DB exists, it might already be initialized.
// If it's new, we might need to rs.initiate().
// Meteor usually handles this.
// Let's rely on the fact that the DB folder looks populated.

setTimeout(() => {
	console.log('Starting Rocket.Chat Server...');

	const startArgs = ['--inspect-brk', '--enable-source-maps', '--experimental-transform-types', '--import', './loader.ts', './server.ts'];

	// Pass environment variables
	const env = {
		NODE_ENV: process.env.NODE_ENV || 'development',
		MONGO_URL: mongoUrl,
		MONGO_OPLOG_URL: oplogUrl,
		PORT: process.env.PORT || '3000',
		ROOT_URL: process.env.ROOT_URL || 'http://localhost:3000',
	};

	serverProcess = spawn(process.execPath, startArgs, {
		env,
		stdio: 'inherit',
	});

	serverProcess.on('close', (code) => {
		console.log(`Server exited with code ${code}`);
		cleanup();
	});
}, 3000); // Wait 3 seconds for mongo

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
