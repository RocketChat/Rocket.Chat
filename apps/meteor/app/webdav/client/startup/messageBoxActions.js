import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { settings } from '../../../settings';
import { messageBox } from '../../../ui-utils';
import { WebdavAccounts } from '../../../models/client';
import { imperativeModal } from '../../../../client/lib/imperativeModal';
import { getWebdavServerName } from '../../../../client/lib/getWebdavServerName';
import AddWebdavAccountModal from '../../../../client/views/room/webdav/AddWebdavAccountModal';
import WebdavFilePickerModal from '../../../../client/views/room/webdav/WebdavFilePickerModal';

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
			const name = getWebdavServerName({ name: account.name, serverURL: account.serverURL, username: account.username });

			messageBox.actions.add('WebDAV', name, {
				id: `webdav-upload-${account._id.toLowerCase()}`,
				icon: 'cloud-plus',
				condition: () => settings.get('Webdav_Integration_Enabled'),
				action({ rid }) {
					imperativeModal.open({
						component: WebdavFilePickerModal,
						props: { rid, onClose: imperativeModal.close, account },
					});
				},
			});
		});
	});
});
