import readline from 'readline';
import fs from 'fs/promises';

const removeOptions = { maxRetries: 3, recursive: true, force: true };

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

const fossify = async () => {
	console.log('Removing Premium Apps and Packages...');
	await fs.rm('./ee', removeOptions);

	console.log('Removing Premium code in the main app...');
	await fs.rm('./apps/meteor/ee', removeOptions);

	console.log('Replacing main files...');
	await fs.access('./apps/meteor/startRocketChatFOSS.ts');
	await fs.rm('./apps/meteor/startRocketChat.ts', { force: true });
	await fs.rename('./apps/meteor/startRocketChatFOSS.ts', './apps/meteor/startRocketChat.ts');

	console.log('Done.');
};

rl.question('Running this script will permanently delete files from the local directory. Proceed? (n,y) ', (answer) => {
	rl.close();

	if (answer.toLowerCase() !== 'y') {
		return;
	}

	fossify().catch((e) => {
		console.error('Fossify failed:', e?.message || e);
		process.exit(1);
	});
});
