import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { modal } from 'meteor/rocketchat:ui';
import { t } from 'meteor/rocketchat:utils';
import { RocketChat } from 'meteor/rocketchat:lib';

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
			confirmOnEnter: false,
		});
	},
});

Meteor.startup(function() {
	Tracker.autorun(() => {
		const accounts = RocketChat.models.WebdavAccounts.find();


		if (accounts.count() === 0) {
			return RocketChat.messageBox.actions.remove(/webdav-upload-/ig);
		}

		accounts.forEach((account) => {
			const name = account.name || `${ account.username }@${ account.server_url.replace(/^https?\:\/\//i, '') }`;
			const title = t('Upload_From', {
				name,
			});
			RocketChat.messageBox.actions.add('WebDAV', name, {
				id: `webdav-upload-${ account._id.toLowerCase() }`,
				icon: 'cloud-plus',
				condition: () => RocketChat.settings.get('Webdav_Integration_Enabled'),
				action() {
					modal.open({
						data: {
							name,
							accountId: account._id,
						},
						title,
						content: 'webdavFilePicker',
						showCancelButton: true,
						showFooter: false,
						showConfirmButton: false,
						closeOnCancel: true,
						html: true,
						confirmOnEnter: false,
					});
				},
			});
		});
	});
});
