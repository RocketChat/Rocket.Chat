/* globals modal, RocketChat, WebdavAccounts*/

Meteor.startup(function() {

	RocketChat.MessageAction.addButton({
		id: 'webdav-upload',
		icon: 'upload',
		label: t('Save_To_Webdav'),
		condition: (message) => {
			if (RocketChat.models.Subscriptions.findOne({ rid: message.rid }) == null) {
				return false;
			}
			if (WebdavAccounts.findOne() == null) {
				return false;
			}
			if (!message.file) {
				return false;
			}

			return RocketChat.settings.get('Webdav_Integration_Enabled');
		},
		action() {
			const [, message] = this._arguments;
			const [attachment] = message.attachments;
			const { file } = message;
			const url = Meteor.absoluteUrl().concat(attachment.title_link.substring(1));
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
