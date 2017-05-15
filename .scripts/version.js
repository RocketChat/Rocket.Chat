/* eslint object-shorthand: 0, prefer-template: 0 */

const path = require('path');
const fs = require('fs');
let pkgJson = {};

try {
	pkgJson = require(path.resolve(
		process.cwd(),
		'./package.json'
	));
} catch (err) {
	console.error('no root package.json found');
}

const readline = require('readline');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

const files = [
	'./package.json',
	'./.sandstorm/sandstorm-pkgdef.capnp',
	'./.travis/snap.sh',
	'./packages/rocketchat-lib/rocketchat.info'
];

console.log('Current version:', pkgJson.version);
rl.question('New version: ', function(version) {
	rl.close();

	version = version.trim();

	if (version === '') {
		return;
	}

	console.log('Updating files to version ' + version);

	files.forEach(function(file) {
		const data = fs.readFileSync(file, 'utf8');

		fs.writeFileSync(file, data.replace(pkgJson.version, version), 'utf8');
	});
});
