import type { IWebdavAccount } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { WebdavAccounts } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';
import { createClient } from 'webdav';

import { settings } from '../../../settings/server';
import { getWebdavCredentials } from '../lib/getWebdavCredentials';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		getWebdavFilePreview(accountId: IWebdavAccount['_id'], path: string): { success: true; data: ArrayBuffer } | undefined;
	}
}

Meteor.methods<ServerMethods>({
	async getWebdavFilePreview(accountId, path) {
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid User', {
				method: 'getWebdavFilePreview',
			});
		}

		if (!settings.get('Webdav_Integration_Enabled') || !settings.get('Accounts_OAuth_Nextcloud_URL')) {
			throw new Meteor.Error('error-not-allowed', 'WebDAV Integration Not Allowed', {
				method: 'getWebdavFilePreview',
			});
		}

		const account = await WebdavAccounts.findOneByIdAndUserId(accountId, userId, {});
		if (!account) {
			throw new Meteor.Error('error-invalid-account', 'Invalid WebDAV Account', {
				method: 'getWebdavFilePreview',
			});
		}

		try {
			const cred = getWebdavCredentials(account);
			const client = createClient(account.serverURL, cred);
			const serverURL = settings.get('Accounts_OAuth_Nextcloud_URL');
			const res = await client.customRequest(`${serverURL}/index.php/core/preview.png?file=${path}&x=64&y=64`, {
				method: 'GET',
				responseType: 'arraybuffer',
			});
			return { success: true, data: res.data as ArrayBuffer };
		} catch (error) {
			// ignore error
		}
	},
});
