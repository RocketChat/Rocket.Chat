import Webdav from 'webdav';
import Future from 'fibers/future';

Meteor.methods({
	async addNewWebdavAccount(formData) {
		const future = new Future();

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid User', {method: 'addNewWebdavAccount'});
		}
		const userId = Meteor.userId();
		if (!RocketChat.settings.get('Webdav_Integration_Allowed')) {
			throw new Meteor.Error('error-not-allowed', 'WebDAV Integration Not Allowed', {method: 'addNewWebdavAccount'});
		}

		check(formData, Match.ObjectIncluding({
			serverURL: String,
			username: String,
			pass: String,
		}));

		const client = new Webdav(
			formData.serverURL,
			formData.username,
			formData.pass
		);
		await client.stat('/').then(() => {
			const accountData = {
				user_id: userId,
				server_url: formData.serverURL,
				username: formData.username,
				password: formData.pass
			};
			RocketChat.models.WebdavAccounts.insert(accountData, (err) => {
				if(err) {
					if (err.code === 11000) {
						future['return']({success: false, message: "webdav-duplicated-account"});
					} else {
						future['return']({success: false, message: "unknown-write-error"});
					}
					return;
				}
				future['return']({success: true, message: "account-saved"});
			});
		},(err) => {
			future['return']({success: false, message: "could-not-access-webdav"});
		});
		return future.wait();
	}
});
