import fs from 'node:fs';

import { Meteor } from 'meteor/meteor';
import mkdirp from 'mkdirp';

import { UploadFS } from './ufs';

Meteor.startup(() => {
	const path = UploadFS.config.tmpDir;
	const mode = UploadFS.config.tmpDirPermissions;

	fs.stat(path, (err) => {
		if (err) {
			// Create the temp directory
			mkdirp(path, { mode })
				.then(() => {
					console.log(`ufs: temp directory created at "${path}"`);
				})
				.catch((err) => {
					console.error(`ufs: cannot create temp directory at "${path}" (${err.message})`);
				});
		} else {
			// Set directory permissions
			fs.chmod(path, mode, (err) => {
				err && console.error(`ufs: cannot set temp directory permissions ${mode} (${err.message})`);
			});
		}
	});
});
