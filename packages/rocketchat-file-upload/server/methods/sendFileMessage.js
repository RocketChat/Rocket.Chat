Meteor.methods({
	'sendFileMessage'(roomId, store, file) {
		var fileId;

		if (!Meteor.userId()) {
			throw new Meteor.Error(203, t('User_logged_out'));
		}

		var room = Meteor.call('canAccessRoom', roomId, Meteor.userId());

		if (!room) {
			return false;
		}

		if (!file._id) {
			fileId = RocketChat.models.Uploads.insertFile(roomId, Meteor.userId(), store, file);
		} else {
			fileId = file._id;
		}

		var attachment = {
			title: `File Uploaded: ${file.name}`,
			title_link: file.url
		};

		if (/^image\/.+/.test(file.type)) {
			attachment.image_url = file.url;
			attachment.image_type = file.type;
			attachment.image_size = file.size;
			// @TODO
			// attachment.image_dimensions = file.identify?.size;
		} else if (/^audio\/.+/.test(file.type)) {
			attachment.audio_url = file.url;
			attachment.audio_type = file.type;
			attachment.audio_size = file.size;
		} else if (/^video\/.+/.test(file.type)) {
			attachment.video_url = file.url;
			attachment.video_type = file.type;
			attachment.video_size = file.size;
		}1

		msg = {
			_id: Random.id(),
			rid: roomId,
			msg: "",
			file: {
				_id: fileId
			},
			groupable: false,
			attachments: [attachment]
		};

		var msg = Meteor.call('sendMessage', msg);
	}
});
