Meteor.methods({
	'sendFileMessage'(roomId, store, file) {
		if (!Meteor.userId()) {
			throw new Meteor.Error(203, 'User_logged_out');
		}

		var room = Meteor.call('canAccessRoom', roomId, Meteor.userId());

		if (!room) {
			return false;
		}

		RocketChat.models.Uploads.updateFileComplete(file._id, Meteor.userId(), _.omit(file, '_id'));

		var fileUrl = '/file-upload/' + file._id + '/' + file.name;

		var attachment = {
			title: `File Uploaded: ${file.name}`,
			title_link: fileUrl,
			title_link_download: true
		};

		if (/^image\/.+/.test(file.type)) {
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

		msg = {
			_id: Random.id(),
			rid: roomId,
			msg: '',
			file: {
				_id: file._id
			},
			groupable: false,
			attachments: [attachment]
		};

		var msg = Meteor.call('sendMessage', msg);
	}
});
