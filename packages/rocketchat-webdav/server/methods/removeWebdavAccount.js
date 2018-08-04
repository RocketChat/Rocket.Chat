import Webdav from 'webdav';
import Future from 'fibers/future';

Meteor.methods({
	removeWebdavAccount(accountId) {
		const future = new Future();

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid User', {method: 'removeWebdavAccount'});
		}
		const userId = Meteor.userId();
		if (!RocketChat.settings.get('Webdav_Integration_Allowed')) {
			throw new Meteor.Error('error-not-allowed', 'WebDAV Integration Not Allowed', {method: 'removeWebdavAccount'});
		}
		check(accountId, String);

		return RocketChat.models.WebdavAccounts.removeById(accountId);
	}
});
