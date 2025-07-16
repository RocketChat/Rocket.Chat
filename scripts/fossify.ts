import readline from 'readline';
import fs from 'fs/promises';

const removeOptions = { maxRetries: 3, recursive: true };

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

const fossify = async () => {
	console.log('Removing Premium Apps and Packages...');
	await fs.rmdir('./ee', removeOptions);

	console.log('Removing Premium code in the main app...');
	await fs.rmdir('./apps/meteor/ee', removeOptions);

	console.log('Replacing main files...');
	await fs.unlink('./apps/meteor/startRocketChat.ts');

	await fs.rename('./apps/meteor/startRocketChatFOSS.ts', './apps/meteor/startRocketChat.ts');

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
