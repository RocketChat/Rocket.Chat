/* eslint object-shorthand: 0, prefer-template: 0 */

const path = require('path');
const fs = require('fs');
const semver = require('semver');
const inquirer = require('inquirer');
const execSync = require('child_process').execSync;
const git = require('simple-git')(process.cwd());


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
	'./.docker/Dockerfile',
	'./packages/rocketchat-lib/rocketchat.info'
];

class Actions {
	static release_rc() {
		function processVersion(version) {
			// console.log('Updating files to version ' + version);

			files.forEach(function(file) {
				const data = fs.readFileSync(file, 'utf8');

				fs.writeFileSync(file, data.replace(pkgJson.version, version), 'utf8');
			});

			execSync('conventional-changelog --config .github/changelog.js -i HISTORY.md -s');

			inquirer.prompt([{
				type: 'confirm',
				message: 'Commit files?',
				name: 'commit'
			}]).then(function(answers) {
				if (!answers.commit) {
					return;
				}

				git.status((error, status) => {
					inquirer.prompt([{
						type: 'checkbox',
						message: 'Select files to commit?',
						name: 'files',
						choices: status.files.map(file => { return {name: `${ file.working_dir } ${ file.path }`, checked: true}; })
					}]).then(function(answers) {
						if (answers.files.length) {
							git.add(answers.files.map(file => file.slice(2)), () => {
								git.commit(`Bump version to ${ version }`, () => {
									inquirer.prompt([{
										type: 'confirm',
										message: `Add tag ${ version }?`,
										name: 'tag'
									}]).then(function(answers) {
										if (answers.tag) {
											// TODO: Add annotated tag
											git.addTag(version);
											// TODO: Push
											// Useg GitHub api to create the release with history
										}
									});
								});
							});
						}
					});
				});
			});
		}


		inquirer.prompt([{
			type: 'list',
			message: `The current version is ${ pkgJson.version }. Update to version:`,
			name: 'version',
			choices: [
				semver.inc(pkgJson.version, 'prerelease', 'rc'),
				// semver.inc(pkgJson.version, 'patch'),
				'custom'
			]
		}]).then(function(answers) {
			if (answers.version === 'custom') {
				inquirer.prompt([{
					name: 'version',
					message: 'Enter your custom version:'
				}]).then(function(answers) {
					processVersion(answers.version);
				});
			} else {
				processVersion(answers.version);
			}
		});
	}

	static release_gm() {
		function processVersion(version) {
			// console.log('Updating files to version ' + version);

			files.forEach(function(file) {
				const data = fs.readFileSync(file, 'utf8');

				fs.writeFileSync(file, data.replace(pkgJson.version, version), 'utf8');
			});

			execSync('conventional-changelog --config .github/changelog.js -i HISTORY.md -s');
			// TODO improve HISTORY generation for GM

			inquirer.prompt([{
				type: 'confirm',
				message: 'Commit files?',
				name: 'commit'
			}]).then(function(answers) {
				if (!answers.commit) {
					return;
				}

				git.status((error, status) => {
					inquirer.prompt([{
						type: 'checkbox',
						message: 'Select files to commit?',
						name: 'files',
						choices: status.files.map(file => { return {name: `${ file.working_dir } ${ file.path }`, checked: true}; })
					}]).then(function(answers) {
						if (answers.files.length) {
							git.add(answers.files.map(file => file.slice(2)), () => {
								git.commit(`Bump version to ${ version }`, () => {
									inquirer.prompt([{
										type: 'confirm',
										message: `Add tag ${ version }?`,
										name: 'tag'
									}]).then(function(answers) {
										if (answers.tag) {
											// TODO: Add annotated tag
											git.addTag(version);
											// TODO: Push
											// Useg GitHub api to create the release with history
										}
									});
								});
							});
						}
					});
				});
			});
		}


		inquirer.prompt([{
			type: 'list',
			message: `The current version is ${ pkgJson.version }. Update to version:`,
			name: 'version',
			choices: [
				semver.inc(pkgJson.version, 'patch'),
				'custom'
			]
		}]).then(function(answers) {
			if (answers.version === 'custom') {
				inquirer.prompt([{
					name: 'version',
					message: 'Enter your custom version:'
				}]).then(function(answers) {
					processVersion(answers.version);
				});
			} else {
				processVersion(answers.version);
			}
		});
	}
}

git.status((err, status) => {
	if (status.current === 'release-candidate') {
		Actions.release_rc();
	} else if (status.current === 'master') {
		Actions.release_gm();
	} else {
		console.log(`No release action for branch ${ status.current }`);
	}
});
