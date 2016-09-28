Meteor.methods({
	snippetMessage: function(message, snippetedAt) {
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

		let me = RocketChat.models.Users.findOneById(Meteor.userId());

		message.snippeted = true;
		message.snippetedAt = snippetedAt || Date.now;
		message.snippetedBy = {
			_id: Meteor.userId(),
			username: me.username
		};

		message = RocketChat.callbacks.run('beforeSaveMessage', message);

		RocketChat.models.Messages.setSnippetedByIdAndUserId(message._id, message.snippetedBy, message.snippeted);

		RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser('message_snippeted', message.rid, '', me, {
			attachments: [{
				"text": message.msg,
				"author_name": message.u.username,
				"author_icon": getAvatarUrlFromUsername(message.u.username),
				"ts": message.ts
			}]
		});
		// RocketChat.models.Uploads.updateFileComplete();

		// const msg = {
		// 	_id: Random.id(),
		// 	rid: roomId,
		// 	msg: ''
		// };
        //
		// return Meteor.call('sendMessage', msg)
	}
});
