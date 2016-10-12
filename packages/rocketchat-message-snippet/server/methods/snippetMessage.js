Meteor.methods({
	snippetMessage: function(message, filename) {
		if ((typeof Meteor.userId() == "undefined") || (Meteor.userId() == null)) {
			throw new Meteor.error("error-invalid-user", "Invalid user",
				{method: 'snippetMessage'});
		}

		let room = RocketChat.models.Rooms.findOne({ _id: message.rid });

		if ((typeof room == "undefined") || (room == null)) {
			return false;
		}

		if (Array.isArray(room.usernames) && (room.usernames.indexOf(Meteor.user().username) == -1)) {
			return false;
		}

		// If we keep history of edits, insert a new message to store history information
		if (RocketChat.settings.get('Message_KeepHistory')) {
			RocketChat.models.Messages.cloneAndSaveAsHistoryById(message._id);
		}

		// Detect extension
		let fileNameSplits = filename.split(".");
		let extension = fileNameSplits[fileNameSplits.length - 1];

		let me = RocketChat.models.Users.findOneById(Meteor.userId());

		message.snippeted = true;
		message.snippetedAt = Date.now;
		message.snippetedBy = {
			_id: Meteor.userId(),
			username: me.username
		};

		message = RocketChat.callbacks.run('beforeSaveMessage', message);

		let file = new Buffer(message.msg);
		let rs = RocketChatFile.bufferToStream(file);
		let ws = RocketChatFileSnippetInstance.createWriteStream(filename, message.msg);
		rs.pipe(ws);

		// Create the SnippetMessage
		RocketChat.models.SnippetMessage.insert({
			rid: message.rid,
			filename: filename,
			extension: extension,
			u: message.u,
			ts: message.ts
		}, function(error, _id) {
			if (error !== undefined && error !== null) {
				console.log(error);
			} else {
				message.snippedId = _id;
				RocketChat.models.Messages.setSnippetedByIdAndUserId(message, message.snippedId, message.snippetedBy,
					message.snippeted);
				RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser(
					'message_snippeted', message.rid, '', me, {
						"snippetId": _id,
						"filename": filename
					});
			}
		});

	}
});
