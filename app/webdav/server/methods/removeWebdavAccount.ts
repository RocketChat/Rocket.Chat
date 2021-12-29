import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { WebdavAccounts } from '../../../models/server/raw';
import { Notifications } from '../../../notifications/server';

Meteor.methods({
	async removeWebdavAccount(accountId) {
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid User', {
				method: 'removeWebdavAccount',
			});
		}

		check(accountId, String);

		const removed = await WebdavAccounts.removeByUserAndId(accountId, userId);
		if (removed) {
			Notifications.notifyUser(userId, 'webdav', {
				type: 'removed',
				account: { _id: accountId },
			});
		}

		return removed;
	},
});
