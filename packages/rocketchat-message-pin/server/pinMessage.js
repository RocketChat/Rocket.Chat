Meteor.methods({
	pinMessage(message, pinnedAt) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'pinMessage'
			});
		}

		if (!RocketChat.settings.get('Message_AllowPinning')) {
			throw new Meteor.Error('error-action-not-allowed', 'Message pinning not allowed', {
				method: 'pinMessage',
				action: 'Message_pinning'
			});
		}

		const room = RocketChat.models.Rooms.findOneById(message.rid);
		if (Array.isArray(room.usernames) && room.usernames.indexOf(Meteor.user().username) === -1) {
			return false;
		}

		let originalMessage = RocketChat.models.Messages.findOneById(message._id);
		if (originalMessage == null || originalMessage._id == null) {
			throw new Meteor.Error('error-invalid-message', 'Message you are pinning was not found', {
				method: 'pinMessage',
				action: 'Message_pinning'
			});
		}

		//If we keep history of edits, insert a new message to store history information
		if (RocketChat.settings.get('Message_KeepHistory')) {
			RocketChat.models.Messages.cloneAndSaveAsHistoryById(message._id);
		}

		const me = RocketChat.models.Users.findOneById(Meteor.userId());
		originalMessage.pinned = true;
		originalMessage.pinnedAt = pinnedAt || Date.now;
		originalMessage.pinnedBy = {
			_id: Meteor.userId(),
			username: me.username
		};

		originalMessage = RocketChat.callbacks.run('beforeSaveMessage', originalMessage);
		RocketChat.models.Messages.setPinnedByIdAndUserId(originalMessage._id, originalMessage.pinnedBy, originalMessage.pinned);

		return RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser('message_pinned', originalMessage.rid, '', me, {
			attachments: [
				{
					'text': originalMessage.msg,
					'author_name': originalMessage.u.username,
					'author_icon': getAvatarUrlFromUsername(originalMessage.u.username),
					'ts': originalMessage.ts
				}
			]
		});
	},
	unpinMessage(message) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'unpinMessage'
			});
		}

		if (!RocketChat.settings.get('Message_AllowPinning')) {
			throw new Meteor.Error('error-action-not-allowed', 'Message pinning not allowed', {
				method: 'unpinMessage',
				action: 'Message_pinning'
			});
		}

		const room = RocketChat.models.Rooms.findOneById(message.rid);

		if (Array.isArray(room.usernames) && room.usernames.indexOf(Meteor.user().username) === -1) {
			return false;
		}

		let originalMessage = RocketChat.models.Messages.findOneById(message._id);

		if (originalMessage == null || originalMessage._id == null) {
			throw new Meteor.Error('error-invalid-message', 'Message you are unpinning was not found', {
				method: 'unpinMessage',
				action: 'Message_pinning'
			});
		}

		//If we keep history of edits, insert a new message to store history information
		if (RocketChat.settings.get('Message_KeepHistory')) {
			RocketChat.models.Messages.cloneAndSaveAsHistoryById(originalMessage._id);
		}

		const me = RocketChat.models.Users.findOneById(Meteor.userId());
		originalMessage.pinned = false;
		originalMessage.pinnedBy = {
			_id: Meteor.userId(),
			username: me.username
		};
		originalMessage = RocketChat.callbacks.run('beforeSaveMessage', originalMessage);

		return RocketChat.models.Messages.setPinnedByIdAndUserId(originalMessage._id, originalMessage.pinnedBy, originalMessage.pinned);
	}
});
