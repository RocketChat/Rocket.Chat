import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { WebdavAccounts } from '../../../models';

Meteor.methods({
	removeWebdavAccount(accountId) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid User', { method: 'removeWebdavAccount' });
		}
		// if (!RocketChat.settings.get('Webdav_Integration_Enabled')) {
		// 	throw new Meteor.Error('error-not-allowed', 'WebDAV Integration Not Allowed', {method: 'removeWebdavAccount'});
		// }
		check(accountId, String);

		return WebdavAccounts.removeByUserAndId(accountId, Meteor.userId());
	},
});
