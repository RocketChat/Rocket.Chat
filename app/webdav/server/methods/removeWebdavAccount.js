import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { WebdavAccounts } from '../../../models';

Meteor.methods({
	removeWebdavAccount(accountId) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid User', { method: 'removeWebdavAccount' });
		}

		check(accountId, String);

		return WebdavAccounts.removeByUserAndId(accountId, Meteor.userId());
	},
});
