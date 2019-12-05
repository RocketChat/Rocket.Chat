import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { WebdavAccounts } from '../../../models';
import { webdavStreamer } from '../lib/webdavStreamer';

Meteor.methods({
	removeWebdavAccount(accountId) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid User', { method: 'removeWebdavAccount' });
		}

		check(accountId, String);

		const removed = WebdavAccounts.removeByUserAndId(accountId, Meteor.userId());
		if (removed) {
			webdavStreamer.emit('webdavAccounts', {
				type: 'removed',
				_id: accountId,
			});
		}
	},
});
