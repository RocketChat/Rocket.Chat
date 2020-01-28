import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { t } from '../../../utils';
import { settings } from '../../../settings';
import { messageBox, modal } from '../../../ui-utils';
import { WebdavAccounts } from '../../../models';

messageBox.actions.add('WebDAV', 'Add Server', {
	id: 'add-webdav',
	icon: 'plus',
	condition: () => settings.get('Webdav_Integration_Enabled'),
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
		const accounts = WebdavAccounts.find();


		if (accounts.count() === 0) {
			return messageBox.actions.remove(/webdav-upload-/ig);
		}

		accounts.forEach((account) => {
			const name = account.name || `${ account.username }@${ account.server_url.replace(/^https?\:\/\//i, '') }`;
			const title = t('Upload_From', {
				name,
			});
			messageBox.actions.add('WebDAV', name, {
				id: `webdav-upload-${ account._id.toLowerCase() }`,
				icon: 'cloud-plus',
				condition: () => settings.get('Webdav_Integration_Enabled'),
				action() {
					modal.open({
						data: {
							name,
							accountId: account._id,
						},
						title,
						modifier: 'modal',
						content: 'webdavFilePicker',
						showCancelButton: false,
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
