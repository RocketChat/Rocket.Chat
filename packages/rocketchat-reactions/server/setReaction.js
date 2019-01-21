import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/tap:i18n';
import { RocketChat } from 'meteor/rocketchat:lib';
import _ from 'underscore';

const removeUserReaction = (message, reaction, id) => {
	const index = message.reactions[reaction].users.map((user) => user.id).indexOf(id);
	message.reactions[reaction].users.splice(index, 1);
	if (message.reactions[reaction].users.length === 0) {
		delete message.reactions[reaction];
	}
	return message;
};

Meteor.methods({
	setReaction(reaction, messageId, shouldReact) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'setReaction' });
		}

		const message = RocketChat.models.Messages.findOneById(messageId);

		if (!message) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'setReaction' });
		}

		const room = Meteor.call('canAccessRoom', message.rid, Meteor.userId());

		if (!room) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'setReaction' });
		}

		reaction = `:${ reaction.replace(/:/g, '') }:`;

		if (!RocketChat.emoji.list[reaction] && RocketChat.models.EmojiCustom.findByNameOrAlias(reaction).count() === 0) {
			throw new Meteor.Error('error-not-allowed', 'Invalid emoji provided.', { method: 'setReaction' });
		}

		const user = Meteor.user();

		if (Array.isArray(room.muted) && room.muted.indexOf(user.username) !== -1 && !room.reactWhenReadOnly) {
			RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
				_id: Random.id(),
				rid: room._id,
				ts: new Date(),
				msg: TAPi18n.__('You_have_been_muted', {}, user.language),
			});
			return false;
		} else if (!RocketChat.models.Subscriptions.findOne({ rid: message.rid })) {
			return false;
		}

		const userAlreadyReacted = Boolean(message.reactions) && Boolean(message.reactions[reaction]) && message.reactions[reaction].users.map((user) => user.id).indexOf(user._id) !== -1;
		// When shouldReact was not informed, toggle the reaction.
		if (shouldReact === undefined) {
			shouldReact = !userAlreadyReacted;
		}

		if (userAlreadyReacted === shouldReact) {
			return;
		}
		if (userAlreadyReacted) {
			removeUserReaction(message, reaction, user._id);

			if (_.isEmpty(message.reactions)) {
				delete message.reactions;
				if (RocketChat.isTheLastMessage(room, message)) {
					RocketChat.models.Rooms.unsetReactionsInLastMessage(room._id);
				}
				RocketChat.models.Messages.unsetReactions(messageId);
				RocketChat.callbacks.run('unsetReaction', messageId, reaction);
			} else {
				if (RocketChat.isTheLastMessage(room, message)) {
					RocketChat.models.Rooms.setReactionsInLastMessage(room._id, message);
				}
				RocketChat.models.Messages.setReactions(messageId, message.reactions);
				RocketChat.callbacks.run('setReaction', messageId, reaction);
			}
		} else {
			if (!message.reactions) {
				message.reactions = {};
			}
			if (!message.reactions[reaction]) {
				message.reactions[reaction] = {
					users:[],
				};
			}
			message.reactions[reaction].users.push({ id: user._id, username: user.username });
			if (RocketChat.isTheLastMessage(room, message)) {
				RocketChat.models.Rooms.setReactionsInLastMessage(room._id, message);
			}
			RocketChat.models.Messages.setReactions(messageId, message.reactions);
			RocketChat.callbacks.run('setReaction', messageId, reaction);
		}

		msgStream.emit(message.rid, message);

		return;
	},
});
