import fs from 'fs';

import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import Future from 'fibers/future';

import { UploadFS } from '.';
import { Tokens } from './ufs-tokens';

Meteor.methods({
	/**
	 * Completes the file transfer
	 * @param fileId
	 * @param storeName
	 * @param token
	 */
	ufsComplete(fileId, storeName, token) {
		check(fileId, String);
		check(storeName, String);
		check(token, String);

		// Get store
		const store = UploadFS.getStore(storeName);
		if (!store) {
			throw new Meteor.Error('invalid-store', 'Store not found');
		}
		// Check token
		if (!store.checkToken(token, fileId)) {
			throw new Meteor.Error('invalid-token', 'Token is not valid');
		}

		const fut = new Future();
		const tmpFile = UploadFS.getTempFilePath(fileId);

		const removeTempFile = function () {
			fs.stat(tmpFile, (err) => {
				!err &&
					fs.unlink(tmpFile, (err2) => {
						err2 && console.error(`ufs: cannot delete temp file "${tmpFile}" (${err2.message})`);
					});
			});
		};

		try {
			// todo check if temp file exists

			// Get file
			const file = store.getCollection().findOne({ _id: fileId });

			if (!file) {
				throw new Meteor.Error('invalid-file', 'File is not valid');
			}

			// Validate file before moving to the store
			store.validate(file);

			// Get the temp file
			const rs = fs.createReadStream(tmpFile, {
				flags: 'r',
				encoding: undefined,
				autoClose: true,
			});

			// Clean upload if error occurs
			rs.on(
				'error',
				Meteor.bindEnvironment(function (err) {
					console.error(err);
					store.getCollection().remove({ _id: fileId });
					fut.throw(err);
				}),
			);

			// Save file in the store
			store.write(
				rs,
				fileId,
				Meteor.bindEnvironment(function (err, file) {
					removeTempFile();

					if (err) {
						fut.throw(err);
					} else {
						// File has been fully uploaded
						// so we don't need to keep the token anymore.
						// Also this ensure that the file cannot be modified with extra chunks later.
						Tokens.remove({ fileId });
						fut.return(file);
					}
				}),
			);

			// catch will not work if fut.wait() is outside try/catch
			return fut.wait();
		} catch (err: any) {
			// If write failed, remove the file
			store.getCollection().remove({ _id: fileId });
			// removeTempFile(); // todo remove temp file on error or try again ?
			throw new Meteor.Error('ufs: cannot upload file', err);
		}
	},
});
