/* globals msgStream */
Meteor.methods({
	setReaction(reaction, messageId) {
		if (!Meteor.userId()) {
			throw new Meteor.Error(203, 'User_logged_out');
		}

		let message = RocketChat.models.Messages.findOneById(messageId);

		if (!Meteor.call('canAccessRoom', message.rid, Meteor.userId())) {
			throw new Meteor.Error(203, '[methods] Not authorized');
		}

		const user = Meteor.user();

		if (message.reactions && message.reactions[reaction] && message.reactions[reaction].usernames.indexOf(user.username) !== -1) {
			message.reactions[reaction].usernames.splice(message.reactions[reaction].usernames.indexOf(user.username), 1);

			if (message.reactions[reaction].usernames.length === 0) {
				delete message.reactions[reaction];
			}

			if (_.isEmpty(message.reactions)) {
				delete message.reactions;
				RocketChat.models.Messages.unsetReactions(messageId);
			} else {
				RocketChat.models.Messages.setReactions(messageId, message.reactions);
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
		}

		msgStream.emit(message.rid, message);

		return;
	}
});
