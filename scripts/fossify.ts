import readline from 'readline';
import fs from 'fs';
import { promisify } from 'util';

const rmdir = promisify(fs.rmdir);
const unlink = promisify(fs.unlink);
const rename = promisify(fs.rename);

const removeOptions = { maxRetries: 3, recursive: true };

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

const fossify = async () => {
	console.log('Removing Premium Apps and Packages...');
	await rmdir('./ee', removeOptions);

	console.log('Removing Premium code in the main app...');
	await rmdir('./apps/meteor/ee', removeOptions);

	console.log('Replacing main files...');
	await unlink('./apps/meteor/server/ee.ts');

	await rename('./apps/meteor/server/foss.ts', './apps/meteor/server/ee.ts');

	console.log('Done.');
};

rl.question('Running this script will permanently delete files from the local directory. Proceed? (n,y) ', (answer) => {
	rl.close();

	if (answer.toLowerCase() !== 'y') {
		return;
	}

	fossify().catch((e) => {
		if (!e) {
			console.error('Unknown error');
			return;
		}

		console.error(e);
	});
});
