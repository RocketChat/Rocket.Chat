import { Meteor } from 'meteor/meteor';

import { settings } from '../../../settings/server';
import { getWebdavCredentials } from './getWebdavCredentials';
import { WebdavAccounts } from '../../../models/server/raw';
import { WebdavClientAdapter } from '../lib/webdavClientAdapter';

Meteor.methods({
	async getFileFromWebdav(accountId, file) {
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid User', { method: 'getFileFromWebdav' });
		}
		if (!settings.get('Webdav_Integration_Enabled')) {
			throw new Meteor.Error('error-not-allowed', 'WebDAV Integration Not Allowed', {
				method: 'getFileFromWebdav',
			});
		}

		const account = await WebdavAccounts.findOneByIdAndUserId(accountId, userId, {});
		if (!account) {
			throw new Meteor.Error('error-invalid-account', 'Invalid WebDAV Account', {
				method: 'getFileFromWebdav',
			});
		}

		try {
			const cred = getWebdavCredentials(account);
			const client = new WebdavClientAdapter(account.serverURL, cred);
			const fileContent = await client.getFileContents(file.filename);
			const data = new Uint8Array(fileContent);
			return { success: true, data };
		} catch (error) {
			throw new Meteor.Error('unable-to-get-file', 'Unable to get file', {
				method: 'getFileFromWebdav',
			});
		}
	},
});
