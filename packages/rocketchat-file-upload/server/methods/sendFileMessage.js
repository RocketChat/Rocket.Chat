import _ from 'underscore';

Meteor.methods({
	'sendFileMessage'(roomId, store, file, msgData = {}) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'sendFileMessage' });
		}

		const room = Meteor.call('canAccessRoom', roomId, Meteor.userId());

		if (!room) {
			return false;
		}

		check(msgData, {
			avatar: Match.Optional(String),
			emoji: Match.Optional(String),
			alias: Match.Optional(String),
			groupable: Match.Optional(Boolean),
			msg: Match.Optional(String)
		});

		RocketChat.models.Uploads.updateFileComplete(file._id, Meteor.userId(), _.omit(file, '_id'));

		const fileUrl = `/file-upload/${ file._id }/${ encodeURI(file.name) }`;

		const attachment = {
			title: file.name,
			type: 'file',
			description: file.description,
			title_link: fileUrl,
			title_link_download: true
		};

		Meteor.wrapAsync(FileUpload.resizeImagePreview(file, Meteor.bindEnvironment(function(r) {

			if (/^image\/.+/.test(file.type)) {
				attachment.image_preview = r;
				attachment.image_url = fileUrl;
				attachment.image_type = file.type;
				attachment.image_size = file.size;
				if (file.identify && file.identify.size) {
					attachment.image_dimensions = file.identify.size;
				}
			} else if (/^audio\/.+/.test(file.type)) {
				attachment.audio_url = fileUrl;
				attachment.audio_type = file.type;
				attachment.audio_size = file.size;
			} else if (/^video\/.+/.test(file.type)) {
				attachment.video_url = fileUrl;
				attachment.video_type = file.type;
				attachment.video_size = file.size;
			}

			const user = Meteor.user();
			let msg = Object.assign({
				_id: Random.id(),
				rid: roomId,
				ts: new Date(),
				msg: '',
				file: {
					_id: file._id,
					name: file.name,
					type: file.type
				},
				groupable: false,
				attachments: [attachment]
			}, msgData);

			msg = Meteor.call('sendMessage', msg);

			Meteor.defer(() => RocketChat.callbacks.run('afterFileUpload', { user, room, message: msg }));

			return msg;
		})));
	}
});
