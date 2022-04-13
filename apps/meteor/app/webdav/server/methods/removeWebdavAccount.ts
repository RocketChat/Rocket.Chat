import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { WebdavAccounts } from '../../../models/server/raw';
import { api } from '../../../../server/sdk/api';

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
			api.broadcast('notify.webdav', userId, {
				type: 'removed',
				account: { _id: accountId },
			});
		}

		return removed;
	},
});
