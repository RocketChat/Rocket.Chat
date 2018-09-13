/* globals modal, RocketChat, WebdavAccounts*/
import { Tracker } from 'meteor/tracker';
Meteor.subscribe('webdavAccounts');

RocketChat.messageBox.actions.add('WebDAV', 'Add Server', {
	id: 'add-webdav',
	icon: 'plus',
	condition: () => RocketChat.settings.get('Webdav_Integration_Enabled'),
	action() {
		modal.open({
			title: t('Webdav_add_new_account'),
			content: 'addWebdavAccount',
			showCancelButton: false,
			showConfirmButton: false,
			showFooter: false,
			closeOnCancel: true,
			html: true,
		});
	},
});
Tracker.autorun(() => {
	const title = t('Upload_From_Webdav');
	WebdavAccounts.find().forEach((account) => {
		const label = `${ account.username }@${ account.server_url.replace(/^https?\:\/\//i, '') }`;
		RocketChat.messageBox.actions.add('WebDAV', account.name || label, {
			id: `webdav-upload-${ account._id.toLowerCase() }`,
			icon: 'cloud-plus',
			condition: () => RocketChat.settings.get('Webdav_Integration_Enabled'),
			action() {
				modal.open({
					data: {
						accountId: account._id,
					},
					title,
					content: 'webdavFilePicker',
					showCancelButton: true,
					showFooter: false,
					showConfirmButton: false,
					closeOnCancel: true,
					html: true,
				});
			},
		});
	});
});
