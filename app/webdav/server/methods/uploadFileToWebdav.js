import stream from 'stream';

import { Meteor } from 'meteor/meteor';
import Future from 'fibers/future';

import { settings } from '../../../settings';
import { WebdavAccounts } from '../../../models';
import { WebdavClientAdapter } from '../lib/webdavClientAdapter';

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
		const client = new WebdavClientAdapter(
			account.server_url,
			account.username,
			account.password,
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
			if (err.message.toLowerCase() === 'not found') {
				client.createDirectory(uploadFolder).then(function() {
					bufferStream.pipe(writeStream);
				}).catch(function() {
					if (err.message.toLowerCase() === 'not found') {
						future.return({ success: false, message: 'webdav-server-not-found' });
					} else {
						future.return({ success: false, message: 'FileUpload_Error' });
					}
				});
			} else if (err.message.toLowerCase() === 'unauthorized') {
				future.return({ success: false, message: 'error-invalid-account' });
			} else {
				future.return({ success: false, message: 'FileUpload_Error' });
			}
		});
		return future.wait();
	},
});
