import toastr from 'toastr';
global.Buffer = global.Buffer || require('buffer').Buffer;

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
						if (error && (error.error === 'error-invalid-user' || error.error === 'error-google-unavailable')) {
							return toastr.error(t(error.error));
						} else if (error) {
							Meteor.loginWithGoogle({
								requestPermissions: ['profile', 'https://www.googleapis.com/auth/drive']
							}, function(error) {
								if (error) {
									return;
								}
								Meteor.call('uploadFileToDrive', {fileData, metaData}, (error) => {
									if (error) {
										return toastr.error(t(error.error));
									}
									toastr.success(t('Successfully_uploaded_file_to_drive_exclamation_mark'));
								});
							});
						} else {
							Meteor.call('uploadFileToDrive', {fileData, metaData}, (error) => {
								if (error) {
									return toastr.error(t(error.error));
								}
								toastr.success(t('Successfully_uploaded_file_to_drive_exclamation_mark'));
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
			return true;
		},
		order: 7,
		group: 'menu'
	});
});
