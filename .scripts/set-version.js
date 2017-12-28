/* eslint object-shorthand: 0, prefer-template: 0 */

const path = require('path');
const fs = require('fs');
const semver = require('semver');
const inquirer = require('inquirer');
const execSync = require('child_process').execSync;
const git = require('simple-git/promise')(process.cwd());

let pkgJson = {};

try {
	pkgJson = require(path.resolve(
		process.cwd(),
		'./package.json'
	));
} catch (err) {
	console.error('no root package.json found');
}

const files = [
	'./package.json',
	'./.sandstorm/sandstorm-pkgdef.capnp',
	'./.travis/snap.sh',
	'./.circleci/snap.sh',
	'./.circleci/update-releases.sh',
	'./.docker/Dockerfile',
	'./packages/rocketchat-lib/rocketchat.info'
];
const readFile = (file) => {
	return new Promise((resolve, reject) => {
		fs.readFile(file, 'utf8', (error, result) => {
			if (error) {
				return reject(error);
			}
			resolve(result);
		});
	})
}
const writeFile = (file, data) => {
	return new Promise((resolve, reject) => {
		fs.writeFile(file, data, 'utf8', (error, result) => {
			if (error) {
				return reject(error);
			}
			resolve(result);
		});
	})
}

let selectedVersion;

git.status()
.then(status => {
	if (status.current === 'release-candidate') {
		return semver.inc(pkgJson.version, 'prerelease', 'rc');
	}
	if (status.current === 'master') {
		return semver.inc(pkgJson.version, 'patch');
	}
	if (status.current === 'develop') {
		return semver.inc(semver.inc(pkgJson.version, 'minor'), 'minor')+'-develop';
	}
	return Promise.reject(`No relea se action for branch ${ status.current }`);
})
.then(nextVersion => inquirer.prompt([{
	type: 'list',
	message: `The current version is ${ pkgJson.version }. Update to version:`,
	name: 'version',
	choices: [
		nextVersion,
		'custom'
	]
}]))
.then(answers => {
	if (answers.version === 'custom') {
		return inquirer.prompt([{
			name: 'version',
			message: 'Enter your custom version:'
		}]);
	}
	return answers;
})
.then(({ version }) => {
	selectedVersion = version;
	return Promise.all(files.map(file => {
		return readFile(file)
			.then(data => {
				return writeFile(file, data.replace(pkgJson.version, version));
			});
	}));
})
.then(() => {
	execSync('conventional-changelog --config .github/changelog.js -i HISTORY.md -s');

	return inquirer.prompt([{
		type: 'confirm',
		message: 'Commit files?',
		name: 'commit'
	}])
})
.then(answers => {
	if (!answers.commit) {
		return Promise.reject(answers);
	}

	return git.status();
})
.then(status => inquirer.prompt([{
		type: 'checkbox',
		message: 'Select files to commit?',
		name: 'files',
		choices: status.files.map(file => { return {name: `${ file.working_dir } ${ file.path }`, checked: true}; })
}]))
.then(answers => answers.files.length && git.add(answers.files.map(file => file.slice(2))))
.then(() => git.commit(`Bump version to ${ selectedVersion }`))
.then(() => inquirer.prompt([{
		type: 'confirm',
		message: `Add tag ${ selectedVersion }?`,
		name: 'tag'
}]))
.then(answers => answers.tag && git.addTag(selectedVersion))
.catch((error) => {
	console.error(error);
});
