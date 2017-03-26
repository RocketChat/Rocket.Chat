Meteor.methods({
	snippetMessage(message, filename) {
		if ((typeof Meteor.userId() === 'undefined') || (Meteor.userId() === null)) {
			//noinspection JSUnresolvedFunction
			throw new Meteor.Error('error-invalid-user', 'Invalid user',
				{method: 'snippetMessage'});
		}

		const room = RocketChat.models.Rooms.findOne({ _id: message.rid });

		if ((typeof room === 'undefined') || (room === null)) {
			return false;
		}

		if (Array.isArray(room.usernames) && (room.usernames.indexOf(Meteor.user().username) === -1)) {
			return false;
		}

		// If we keep history of edits, insert a new message to store history information
		if (RocketChat.settings.get('Message_KeepHistory')) {
			RocketChat.models.Messages.cloneAndSaveAsHistoryById(message._id);
		}

		const me = RocketChat.models.Users.findOneById(Meteor.userId());

		message.snippeted = true;
		message.snippetedAt = Date.now;
		message.snippetedBy = {
			_id: Meteor.userId(),
			username: me.username
		};

		message = RocketChat.callbacks.run('beforeSaveMessage', message);

		// Create the SnippetMessage
		RocketChat.models.Messages.setSnippetedByIdAndUserId(message, filename, message.snippetedBy,
			message.snippeted, Date.now, filename);

		RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser(
			'message_snippeted', message.rid, '', me, {	'snippetId': message._id, 'snippetName': filename });
	}
});
