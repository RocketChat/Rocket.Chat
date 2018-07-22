/* globals modal RocketChat */
import { Tracker } from 'meteor/tracker';
Meteor.subscribe('webdavAccounts');

RocketChat.messageBox.actions.add('WebDAV', 'Add Server', {
	id: 'add-webdav',
	icon: 'plus',
	condition: () => RocketChat.settings.get('Webdav_Integration_Allowed'),
	action() {
		modal.open({
			title: t('Add_New_Webdav_Account'),
			content: 'addWebdavAccount',
			showCancelButton: false,
			showConfirmButton: false,
			showFooter: false,
			closeOnCancel: true,
			html: true,
		});
	}
});
Tracker.autorun(() => {
	WebdavAccounts.find().fetch().forEach((account) => {
		//label = username@server_url, remove http/s from server_url
		const label = account.username + '@'+account.server_url.replace(/^https?\:\/\//i, "");
		RocketChat.messageBox.actions.add('WebDAV', label, {
			id: 'webdav-upload-' + account._id.toLowerCase(),
			icon: 'webdav', //add icon for webdav
			condition: () => RocketChat.settings.get('Webdav_Integration_Allowed'),
			action() {
				modal.open({
					data: {
						accountId: account._id
					},
					title: t('Upload_From_Webdav'),
					content: 'webdavFilePicker',
					showCancelButton: true,
					showConfirmButton: false,
					closeOnCancel: true,
					html: true,
				});
			}
		});
	});
});

