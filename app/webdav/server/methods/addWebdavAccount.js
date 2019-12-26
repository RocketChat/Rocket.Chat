import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { settings } from '../../../settings';
import { WebdavAccounts } from '../../../models';
import { WebdavClientAdapter } from '../lib/webdavClientAdapter';
import { Notifications } from '../../../notifications/server';

Meteor.methods({
	async addWebdavAccount(formData) {
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid User', { method: 'addWebdavAccount' });
		}

		if (!settings.get('Webdav_Integration_Enabled')) {
			throw new Meteor.Error('error-not-allowed', 'WebDAV Integration Not Allowed', { method: 'addWebdavAccount' });
		}

		check(formData, Match.ObjectIncluding({
			serverURL: String,
			username: String,
			pass: String,
		}));

		const duplicateAccount = WebdavAccounts.findOne({ user_id: userId, server_url: formData.serverURL, username: formData.username });
		if (duplicateAccount !== undefined) {
			throw new Meteor.Error('duplicated-account', {
				method: 'addWebdavAccount',
			});
		}

		try {
			const client = new WebdavClientAdapter(
				formData.serverURL,
				{
					username: formData.username,
					password: formData.pass,
				},
			);

			const accountData = {
				user_id: userId,
				server_url: formData.serverURL,
				username: formData.username,
				password: formData.pass,
				name: formData.name,
			};

			await client.stat('/');
			WebdavAccounts.insert(accountData);
			Notifications.notifyUser(userId, 'webdav', {
				type: 'changed',
				account: accountData,
			});
		} catch (error) {
			throw new Meteor.Error('could-not-access-webdav', { method: 'addWebdavAccount' });
		}
		return true;
	},

	async addWebdavAccountByToken(data) {
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid User', { method: 'addWebdavAccount' });
		}

		if (!settings.get('Webdav_Integration_Enabled')) {
			throw new Meteor.Error('error-not-allowed', 'WebDAV Integration Not Allowed', { method: 'addWebdavAccount' });
		}

		check(data, Match.ObjectIncluding({
			serverURL: String,
		}));

		try {
			const client = new WebdavClientAdapter(
				data.serverURL,
				{ token: data.token },
			);

			const accountData = {
				user_id: userId,
				server_url: data.serverURL,
				token: data.token,
				name: data.name,
			};

			await client.stat('/');
			WebdavAccounts.upsert({
				user_id: userId,
				server_url: data.serverURL,
				name: data.name,
			}, {
				$set: accountData,
			});
			Notifications.notifyUser(userId, 'webdav', {
				type: 'changed',
				account: accountData,
			});
		} catch (error) {
			throw new Meteor.Error('could-not-access-webdav', { method: 'addWebdavAccount' });
		}

		return true;
	},
});
