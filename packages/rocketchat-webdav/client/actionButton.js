/* globals modal, RocketChat, WebdavAccounts*/

Meteor.startup(function() {

	RocketChat.MessageAction.addButton({
		id: 'webdav-upload',
		icon: 'upload',
		label: t('Upload_To_Webdav'),
		condition: (message) => {
			if (RocketChat.models.Subscriptions.findOne({rid: message.rid}) == null) {
				return false;
			}
			if (WebdavAccounts.findOne() == null) {
				return false;
			}
			if (!message.file) {
				return false;
			}

			return RocketChat.settings.get('Webdav_Integration_Allowed');
		},
		action() {
			const message = this._arguments[1];
			const attachment = message.attachments[0];
			const file = message.file;
			const url = Meteor.absoluteUrl().concat(attachment.title_link.substring(1));
			modal.open({
				data: {
					message,
					attachment,
					file,
					url
				},
				title: t('Save_To_Webdav'),
				content: 'selectWebdavAccount',
				showCancelButton: true,
				showConfirmButton: false,
				closeOnCancel: true,
				html: true
			});
		},
		order: 100,
		group: 'menu'
	});
});
