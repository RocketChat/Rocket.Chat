/* globals FileUpload */
import Webdav from 'webdav';
import Future from 'fibers/future';

Meteor.methods({
	async getFileFromWebdav(accountId, file) {
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
		const future = new Future();
		await client.getFileContents(file.filename).then(function(fileContent) {
			const byteArray = new Uint8Array(fileContent);
			future['return']({success: true, data: byteArray});
		}, function(error) {
			future['return']({success: false, data: error});
		});

		return future.wait();
	}
});
