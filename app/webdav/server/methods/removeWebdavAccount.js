import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { WebdavAccounts } from '../../../models';
import { Notifications } from '../../../notifications/server';

Meteor.methods({
	removeWebdavAccount(accountId) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid User', { method: 'removeWebdavAccount' });
		}

		check(accountId, String);

		const removed = WebdavAccounts.removeByUserAndId(accountId, Meteor.userId());
		if (removed) {
			Notifications.notifyUser(Meteor.userId(), 'webdav', {
				type: 'removed',
				account: { _id: accountId },
			});
		}

		return removed;
	},
});
