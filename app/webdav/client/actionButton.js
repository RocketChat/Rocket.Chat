import { Meteor } from 'meteor/meteor';
import { t, getURL } from '/app/utils';
import { Subscriptions, WebdavAccounts } from '/app/models';
import { settings } from '/app/settings';
import { MessageAction, modal } from '/app/ui-utils';

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
			const [, message] = this._arguments;
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
