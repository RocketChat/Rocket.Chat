import { Meteor } from 'meteor/meteor';
import { t, getURL } from '../../utils';
import { Subscriptions, WebdavAccounts } from '../../models';
import { settings } from '../../settings';
import { MessageAction, modal } from '../../ui-utils';
import { messageArgs } from '../../ui-utils/client/lib/messageArgs';

Meteor.startup(function() {
	MessageAction.addButton({
		id: 'webdav-upload',
		icon: 'upload',
		label: t('Save_To_Webdav'),
		condition: (message) => {
			if (Subscriptions.findOne({ rid: message.rid }) == null) {
				return false;
			}
			if (WebdavAccounts.findOne() == null) {
				return false;
			}
			if (!message.file) {
				return false;
			}

			return settings.get('Webdav_Integration_Enabled');
		},
		action() {
			const { msg: message } = messageArgs(this);
			const [attachment] = message.attachments;
			const { file } = message;
			const url = getURL(attachment.title_link, { full: true });
			modal.open({
				data: {
					message,
					attachment,
					file,
					url,
				},
				title: t('Save_To_Webdav'),
				content: 'selectWebdavAccount',
				showCancelButton: true,
				showConfirmButton: false,
				closeOnCancel: true,
				html: true,
			});
		},
		order: 100,
		group: 'menu',
	});
});
