import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import _ from 'underscore';

import { Messages, EmojiCustom, Rooms } from '../../models';
import { Notifications } from '../../notifications';
import { callbacks } from '../../callbacks';
import { emoji } from '../../emoji';
import { isTheLastMessage, msgStream } from '../../lib';
import { hasPermission } from '../../authorization/server/functions/hasPermission';

const removeUserReaction = (message, reaction, username) => {
	message.reactions[reaction].usernames.splice(message.reactions[reaction].usernames.indexOf(username), 1);
	if (message.reactions[reaction].usernames.length === 0) {
		delete message.reactions[reaction];
	}
	return message;
};

async function setReaction(room, user, message, reaction, shouldReact) {
	reaction = `:${ reaction.replace(/:/g, '') }:`;

	if (!emoji.list[reaction] && EmojiCustom.findByNameOrAlias(reaction).count() === 0) {
		throw new Meteor.Error('error-not-allowed', 'Invalid emoji provided.', { method: 'setReaction' });
	}

	if (room.ro === true && (!room.reactWhenReadOnly && !hasPermission(user._id, 'post-readonly', room._id))) {
		// Unless the user was manually unmuted
		if (!(room.unmuted || []).includes(user.username)) {
			throw new Error('You can\'t send messages because the room is readonly.');
		}
	}

	if (Array.isArray(room.muted) && room.muted.indexOf(user.username) !== -1) {
		throw new Meteor.Error('error-not-allowed', TAPi18n.__('You_have_been_muted', {}, user.language), {
			rid: room._id,
		});
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
			if (isTheLastMessage(room, message)) {
				Rooms.unsetReactionsInLastMessage(room._id);
			}
			Messages.unsetReactions(message._id);
		} else {
			Messages.setReactions(message._id, message.reactions);
			if (isTheLastMessage(room, message)) {
				Rooms.setReactionsInLastMessage(room._id, message);
			}
		}
		callbacks.run('unsetReaction', message._id, reaction);
		callbacks.run('afterUnsetReaction', message, { user, reaction, shouldReact });
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
		Messages.setReactions(message._id, message.reactions);
		if (isTheLastMessage(room, message)) {
			Rooms.setReactionsInLastMessage(room._id, message);
		}
		callbacks.run('setReaction', message._id, reaction);
		callbacks.run('afterSetReaction', message, { user, reaction, shouldReact });
	}

	msgStream.emit(message.rid, message);
}

export const executeSetReaction = async function(reaction, messageId, shouldReact) {
	const user = Meteor.user();

	if (!user) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'setReaction' });
	}

	const message = Messages.findOneById(messageId);

	if (!message) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'setReaction' });
	}

	const room = Meteor.call('canAccessRoom', message.rid, Meteor.userId());

	if (!room) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'setReaction' });
	}

	return setReaction(room, user, message, reaction, shouldReact);
};

Meteor.methods({
	setReaction(reaction, messageId, shouldReact) {
		try {
			return Promise.await(executeSetReaction(reaction, messageId, shouldReact));
		} catch (e) {
			if (e.error === 'error-not-allowed' && e.reason && e.details && e.details.rid) {
				Notifications.notifyUser(Meteor.userId(), 'message', {
					_id: Random.id(),
					rid: e.details.rid,
					ts: new Date(),
					msg: e.reason,
				});

				return false;
			}

			throw e;
		}
	},
});
