import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { WebdavAccounts } from '@rocket.chat/models';

import { settings } from '../../../settings/server';
import { WebdavClientAdapter } from '../lib/webdavClientAdapter';
import { api } from '../../../../server/sdk/api';

Meteor.methods({
	async addWebdavAccount(formData) {
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid User', { method: 'addWebdavAccount' });
		}

		if (!settings.get('Webdav_Integration_Enabled')) {
			throw new Meteor.Error('error-not-allowed', 'WebDAV Integration Not Allowed', {
				method: 'addWebdavAccount',
			});
		}

		check(
			formData,
			Match.ObjectIncluding({
				serverURL: String,
				username: String,
				password: String,
				name: Match.Maybe(String),
			}),
		);

		const duplicateAccount = await WebdavAccounts.findOneByUserIdServerUrlAndUsername(
			{ userId, serverURL: formData.serverURL, username: formData.username },
			{},
		);

		if (duplicateAccount !== null) {
			throw new Meteor.Error('duplicated-account', 'Account not found', {
				method: 'addWebdavAccount',
			});
		}

		try {
			const client = new WebdavClientAdapter(formData.serverURL, {
				username: formData.username,
				password: formData.password,
			});

			const accountData = {
				userId,
				serverURL: formData.serverURL,
				username: formData.username,
				password: formData.password,
				name: formData.name ?? '',
			};

			await client.stat('/');
			await WebdavAccounts.insertOne(accountData);

			api.broadcast('notify.webdav', userId, {
				type: 'changed',
				account: accountData,
			});
		} catch (error) {
			throw new Meteor.Error('could-not-access-webdav', 'Could not access webdav', {
				method: 'addWebdavAccount',
			});
		}
		return true;
	},

	async addWebdavAccountByToken(data) {
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid User', { method: 'addWebdavAccount' });
		}

		if (!settings.get('Webdav_Integration_Enabled')) {
			throw new Meteor.Error('error-not-allowed', 'WebDAV Integration Not Allowed', {
				method: 'addWebdavAccount',
			});
		}

		check(
			data,
			Match.ObjectIncluding({
				serverURL: String,
				token: Match.ObjectIncluding({
					access_token: String,
					token_type: String,
					refresh_token: Match.Optional(String),
				}),
				name: Match.Maybe(String),
			}),
		);

		try {
			const client = new WebdavClientAdapter(data.serverURL, { token: data.token });

			const accountData = {
				userId,
				serverURL: data.serverURL,
				token: data.token,
				name: data.name ?? '',
			};

			await client.stat('/');
			await WebdavAccounts.updateOne(
				{
					userId,
					serverURL: data.serverURL,
					name: data.name ?? '',
				},
				{
					$set: accountData,
				},
				{
					upsert: true,
				},
			);
			api.broadcast('notify.webdav', userId, {
				type: 'changed',
				account: accountData,
			});
		} catch (error) {
			throw new Meteor.Error('could-not-access-webdav', 'Could not access webdav', {
				method: 'addWebdavAccount',
			});
		}

		return true;
	},
});
