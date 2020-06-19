import { Meteor } from 'meteor/meteor';

import { settings } from '../../../settings';
import { getWebdavCredentials } from './getWebdavCredentials';
import { WebdavAccounts } from '../../../models';
import { WebdavClientAdapter } from '../lib/webdavClientAdapter';

Meteor.methods({
	async getWebdavFileList(accountId, path) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid User', { method: 'getWebdavFileList' });
		}

		if (!settings.get('Webdav_Integration_Enabled')) {
			throw new Meteor.Error('error-not-allowed', 'WebDAV Integration Not Allowed', { method: 'getWebdavFileList' });
		}

		const account = WebdavAccounts.findOne({ _id: accountId, user_id: Meteor.userId() });
		if (!account) {
			throw new Meteor.Error('error-invalid-account', 'Invalid WebDAV Account', { method: 'getWebdavFileList' });
		}

		try {
			const cred = getWebdavCredentials(account);
			const client = new WebdavClientAdapter(account.server_url, cred);
			const data = await client.getDirectoryContents(path);
			return { success: true, data };
		} catch (error) {
			throw new Meteor.Error('could-not-access-webdav', { method: 'getWebdavFileList' });
		}
	},
});
