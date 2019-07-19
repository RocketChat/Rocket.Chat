import { Meteor } from 'meteor/meteor';
import { createClient } from 'webdav';

import { settings } from '../../../settings';
import { WebdavAccounts } from '../../../models';

Meteor.methods({
	async getFileFromWebdav(accountId, file) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid User', { method: 'getFileFromWebdav' });
		}
		if (!settings.get('Webdav_Integration_Enabled')) {
			throw new Meteor.Error('error-not-allowed', 'WebDAV Integration Not Allowed', { method: 'getFileFromWebdav' });
		}

		const account = WebdavAccounts.findOne({ _id: accountId, user_id: Meteor.userId() });
		if (!account) {
			throw new Meteor.Error('error-invalid-account', 'Invalid WebDAV Account', { method: 'getFileFromWebdav' });
		}
		const client = createClient(
			account.server_url,
			{
				username: account.username,
				password: account.password,
			}
		);
		try {
			const fileContent = await client.getFileContents(file.filename);
			const data = new Uint8Array(fileContent);
			return { success: true, data };
		} catch (error) {
			return { success: false, data: error };
		}
	},
});
