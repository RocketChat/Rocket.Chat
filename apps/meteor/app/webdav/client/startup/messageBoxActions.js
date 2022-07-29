import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { t } from '../../../utils';
import { settings } from '../../../settings';
import { messageBox, modal } from '../../../ui-utils';
import { WebdavAccounts } from '../../../models/client';
import { imperativeModal } from '../../../../client/lib/imperativeModal';
import AddWebdavAccountModal from '../../../../client/views/room/webdav/AddWebdavAccountModal';

messageBox.actions.add('WebDAV', 'Add Server', {
	id: 'add-webdav',
	icon: 'plus',
	condition: () => settings.get('Webdav_Integration_Enabled'),
	action() {
		imperativeModal.open({
			component: AddWebdavAccountModal,
			props: { onClose: imperativeModal.close, onConfirm: imperativeModal.close },
		});
	},
});

Meteor.startup(function () {
	Tracker.autorun(() => {
		const accounts = WebdavAccounts.find();

		if (accounts.count() === 0) {
			return messageBox.actions.remove('WebDAV', /webdav-upload-/gi);
		}

		accounts.forEach((account) => {
			const name = account.name || `${account.username}@${account.serverURL.replace(/^https?\:\/\//i, '')}`;
			const title = t('Upload_From', {
				name,
			});
			messageBox.actions.add('WebDAV', name, {
				id: `webdav-upload-${account._id.toLowerCase()}`,
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
