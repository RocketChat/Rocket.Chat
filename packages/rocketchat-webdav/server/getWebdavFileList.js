import Webdav from 'webdav';

Meteor.methods({
	getWebdavFileList(accountId, path) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid User', {method: 'addNewWebdavAccount'});
		}
		const userId = Meteor.userId();
		if (!RocketChat.settings.get('Webdav_Integration_Allowed')) {
			throw new Meteor.Error('error-not-allowed', 'WebDAV Integration Not Allowed', {method: 'addNewWebdavAccount'});
		}

		const account = RocketChat.models.WebdavAccounts.findOne({ _id: accountId });
		if(!account) {
			throw new Meteor.Error('error-invalid-webdav-account', 'Invalid WebDAV Account', {method: 'addNewWebdavAccount'});
		}

		const client = new Webdav(
			account.server_url,
			account.username,
			account.password
		);
		return client.getDirectoryContents(path);
	}
});
