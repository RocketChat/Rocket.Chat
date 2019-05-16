import stream from 'stream';

import { Meteor } from 'meteor/meteor';
import Future from 'fibers/future';
import { createClient } from 'webdav';

import { settings } from '../../../settings';
import { WebdavAccounts } from '../../../models';

Meteor.methods({
	async uploadFileToWebdav(accountId, fileData, name) {
		const uploadFolder = 'Rocket.Chat Uploads/';
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid User', { method: 'uploadFileToWebdav' });
		}
		if (!settings.get('Webdav_Integration_Enabled')) {
			throw new Meteor.Error('error-not-allowed', 'WebDAV Integration Not Allowed', { method: 'uploadFileToWebdav' });
		}

		const account = WebdavAccounts.findOne({ _id: accountId });
		if (!account) {
			throw new Meteor.Error('error-invalid-account', 'Invalid WebDAV Account', { method: 'uploadFileToWebdav' });
		}
		const client = createClient(
			account.server_url,
			{
				username: account.username,
				password: account.password,
			}
		);
		const future = new Future();

		// create buffer stream from file data
		let bufferStream = new stream.PassThrough();
		if (fileData) {
			bufferStream.end(fileData);
		} else {
			bufferStream = null;
		}

		// create a write stream on remote webdav server
		const writeStream = client.createWriteStream(`${ uploadFolder }/${ name }`);
		writeStream.on('end', function() {
			future.return({ success: true });
		});
		writeStream.on('error', function() {
			future.return({ success: false, message: 'FileUpload_Error' });
		});

		await client.stat(uploadFolder).then(function() {
			bufferStream.pipe(writeStream);
		}).catch(function(err) {
			if (err.status === 404) {
				client.createDirectory(uploadFolder).then(function() {
					bufferStream.pipe(writeStream);
				}).catch(function() {
					if (err.status === 404) {
						future.return({ success: false, message: 'webdav-server-not-found' });
					} else {
						future.return({ success: false, message: 'FileUpload_Error' });
					}
				});
			} else if (err.status === 401) {
				future.return({ success: false, message: 'error-invalid-account' });
			} else {
				future.return({ success: false, message: 'FileUpload_Error' });
			}
		});
		return future.wait();
	},
});
