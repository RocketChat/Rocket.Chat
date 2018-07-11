import toastr from 'toastr';

Meteor.startup(function() {
	RocketChat.MessageAction.addButton({
		id: 'drive-upload',
		// icon to be added
		icon: 'drive',
		label: 'Upload To Drive',
		async action() {
			const message = this._arguments[1];
			const attachment = message.attachments[0];
			const file = message.file;
			const url = Meteor.absoluteUrl().concat(attachment.title_link.substring(1));

			const metaData = {
				'name': `${ attachment.title }`,
				'mimeType': `${ file.type }`
			};

			const fileRequest = new XMLHttpRequest();
			fileRequest.open('GET', url, true);
			fileRequest.responseType = 'arraybuffer';

			fileRequest.onload = function() {
				const arrayBuffer = fileRequest.response;
				if (arrayBuffer) {
					const fileData = new Uint8Array(arrayBuffer);
					Meteor.call('checkDriveAccess', (error) => {
						if (error && error.error !== 'error-unauthenticated-user') {
							return toastr.error(t(error.error));
						} else if (error) {
							Meteor.loginWithGoogle({
								requestPermissions: ['profile', 'https://www.googleapis.com/auth/drive']
							}, function(error) {
								if (error) {
									return;
								}
								Meteor.call('uploadFileToDrive', {fileData, metaData}, (error, status) => {
									if (error) {
										return toastr.error(t(error.error));
									} else if (status === false) {
										return toastr.error(t('Failed_Drive_Upload'));
									} else {
										toastr.success(t('Success_Drive_Upload'));
									}
								});
							});
						} else {
							Meteor.call('uploadFileToDrive', {fileData, metaData}, (error) => {
								if (error) {
									return toastr.error(t(error.error));
								} else if (status === false) {
									return toastr.error(t('Failed_Drive_Upload'));
								} else {
									toastr.success(t('Success_Drive_Upload'));
								}
							});
						}
					});
				}
			};

			fileRequest.send(null);
		},

		condition(message) {
			if (RocketChat.models.Subscriptions.findOne({rid: message.rid}) == null) {
				return false;
			}
			if (!message.file) {
				return false;
			}
			if (!RocketChat.settings.get('Accounts_OAuth_Google')) {
				return false;
			}
			return RocketChat.settings.get('Google_Drive_Access');
		},
		order: 7,
		group: 'menu'
	});
});
