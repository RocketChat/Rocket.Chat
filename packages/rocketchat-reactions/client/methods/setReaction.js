import _ from 'underscore';

Meteor.methods({
	setReaction(reaction, messageId) {
		if (!Meteor.userId()) {
			throw new Meteor.Error(203, 'User_logged_out');
		}

		const user = Meteor.user();

		const message = RocketChat.models.Messages.findOne({ _id: messageId });
		const room = RocketChat.models.Rooms.findOne({ _id: message.rid });

		if (Array.isArray(room.muted) && room.muted.indexOf(user.username) !== -1 && !room.reactWhenReadOnly) {
			return false;
		} else if (!RocketChat.models.Subscriptions.findOne({ rid: message.rid })) {
			return false;
		} else if (message.private) {
			return false;
		} else if (!RocketChat.emoji.list[reaction] && RocketChat.models.EmojiCustom.findByNameOrAlias(reaction).count() === 0) {
			return false;
		}

		if (message.reactions && message.reactions[reaction] && message.reactions[reaction].usernames.indexOf(user.username) !== -1) {
			message.reactions[reaction].usernames.splice(message.reactions[reaction].usernames.indexOf(user.username), 1);

			if (message.reactions[reaction].usernames.length === 0) {
				delete message.reactions[reaction];
			}

			if (_.isEmpty(message.reactions)) {
				delete message.reactions;
				RocketChat.models.Messages.unsetReactions(messageId);
				RocketChat.callbacks.run('unsetReaction', messageId, reaction);
			} else {
				RocketChat.models.Messages.setReactions(messageId, message.reactions);
				RocketChat.callbacks.run('setReaction', messageId, reaction);
			}
		} else {
			if (!message.reactions) {
				message.reactions = {};
			}
			if (!message.reactions[reaction]) {
				message.reactions[reaction] = {
					usernames: []
				};
			}
			message.reactions[reaction].usernames.push(user.username);

			RocketChat.models.Messages.setReactions(messageId, message.reactions);
			RocketChat.callbacks.run('setReaction', messageId, reaction);
		}

		return;
	}
});
