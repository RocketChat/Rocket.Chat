import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/tap:i18n';
import { RocketChat } from 'meteor/rocketchat:lib';
import _ from 'underscore';

const removeUserReaction = (message, reaction, username) => {
	message.reactions[reaction].usernames.splice(message.reactions[reaction].usernames.indexOf(username), 1);
	if (message.reactions[reaction].usernames.length === 0) {
		delete message.reactions[reaction];
	}
	return message;
};

RocketChat.setReaction = function(room, user, message, reaction, shouldReact) {
	reaction = `:${ reaction.replace(/:/g, '') }:`;

	if (!RocketChat.emoji.list[reaction] && RocketChat.models.EmojiCustom.findByNameOrAlias(reaction).count() === 0) {
		throw new Meteor.Error('error-not-allowed', 'Invalid emoji provided.', { method: 'setReaction' });
	}

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

	const userAlreadyReacted = Boolean(message.reactions) && Boolean(message.reactions[reaction]) && message.reactions[reaction].usernames.indexOf(user.username) !== -1;
	// When shouldReact was not informed, toggle the reaction.
	if (shouldReact === undefined) {
		shouldReact = !userAlreadyReacted;
	}

	if (userAlreadyReacted === shouldReact) {
		return;
	}
	if (userAlreadyReacted) {
		removeUserReaction(message, reaction, user.username);

		if (_.isEmpty(message.reactions)) {
			delete message.reactions;
			if (RocketChat.isTheLastMessage(room, message)) {
				RocketChat.models.Rooms.unsetReactionsInLastMessage(room._id);
			}
			RocketChat.models.Messages.unsetReactions(message._id);
			RocketChat.callbacks.run('unsetReaction', message._id, reaction);
			RocketChat.callbacks.run('afterUnsetReaction', message, { user, reaction, shouldReact });
		} else {
			if (RocketChat.isTheLastMessage(room, message)) {
				RocketChat.models.Rooms.setReactionsInLastMessage(room._id, message);
			}
			RocketChat.models.Messages.setReactions(message._id, message.reactions);
			RocketChat.callbacks.run('setReaction', message._id, reaction);
			RocketChat.callbacks.run('afterSetReaction', message, { user, reaction, shouldReact });
		}
	} else {
		if (!message.reactions) {
			message.reactions = {};
		}
		if (!message.reactions[reaction]) {
			message.reactions[reaction] = {
				usernames: [],
			};
		}
		message.reactions[reaction].usernames.push(user.username);
		if (RocketChat.isTheLastMessage(room, message)) {
			RocketChat.models.Rooms.setReactionsInLastMessage(room._id, message);
		}
		RocketChat.models.Messages.setReactions(message._id, message.reactions);
		RocketChat.callbacks.run('setReaction', message._id, reaction);
		RocketChat.callbacks.run('afterSetReaction', message, { user, reaction, shouldReact });
	}

	msgStream.emit(message.rid, message);
};

Meteor.methods({
	setReaction(reaction, messageId, shouldReact) {
		const user = Meteor.user();

		const message = RocketChat.models.Messages.findOneById(messageId);

		const room = Meteor.call('canAccessRoom', message.rid, Meteor.userId());

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'setReaction' });
		}

		if (!message) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'setReaction' });
		}

		if (!room) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'setReaction' });
		}

		RocketChat.setReaction(room, user, message, reaction, shouldReact);

		return;
	},
});
