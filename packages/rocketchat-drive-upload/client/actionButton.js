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

			const options = {};

			HTTP.call('GET', url, options, function(err, response) {
				const fileData = new Buffer(response.content, 'base64');
				Meteor.call('checkDriveAccess', (err, authorized) => {
					if (!authorized) {
						Meteor.loginWithGoogle({
							requestPermissions: ['profile', 'https://www.googleapis.com/auth/drive']
						}, function(error) {
							if (error) {
								console.log(error);
							}
							Meteor.call('uploadFileToDrive', {fileData, metaData}, () => toastr.success(t('Successfully_uploaded_file_to_drive_exclamation_mark')));
						});
					} else {
						Meteor.call('uploadFileToDrive', {fileData, metaData}, () => toastr.success(t('Successfully_uploaded_file_to_drive_exclamation_mark')));
					}
				});
			});
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
