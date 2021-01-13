import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { Messages, Rooms, Subscriptions } from '../../../models';
import { callbacks } from '../../../callbacks';
import { emoji } from '../../../emoji';
import { roomTypes } from '../../../utils/client';

Meteor.methods({
	setReaction(reaction, messageId) {
		if (!Meteor.userId()) {
			throw new Meteor.Error(203, 'User_logged_out');
		}

		const user = Meteor.user();

		const message = Messages.findOne({ _id: messageId });
		const room = Rooms.findOne({ _id: message.rid });

		if (message.private) {
			return false;
		}

		if (!emoji.list[reaction]) {
			return false;
		}

		if (roomTypes.readOnly(room._id, user._id)) {
			return false;
		}

		if (!Subscriptions.findOne({ rid: message.rid })) {
			return false;
		}

		const idx = message.reactions && message.reactions[reaction] && message.reactions[reaction].userIds.indexOf(user._id);

		if (idx && idx !== -1) {
			// both userId and its corresponding username are at the same position
			message.reactions[reaction].userIds.splice(idx, 1);
			message.reactions[reaction].usernames.splice(idx, 1);

			if (message.reactions[reaction].userIds.length === 0) {
				delete message.reactions[reaction];
			}

			if (_.isEmpty(message.reactions)) {
				delete message.reactions;
				Messages.unsetReactions(messageId);
				callbacks.run('unsetReaction', messageId, reaction);
			} else {
				Messages.setReactions(messageId, message.reactions);
				callbacks.run('setReaction', messageId, reaction);
			}
		} else {
			if (!message.reactions) {
				message.reactions = {};
			}
			if (!message.reactions[reaction]) {
				message.reactions[reaction] = {
					usernames: [],
					userIds: [],
				};
			}
			message.reactions[reaction].usernames.push(user.username);
			message.reactions[reaction].userIds.push(user._id);

			Messages.setReactions(messageId, message.reactions);
			callbacks.run('setReaction', messageId, reaction);
		}
	},
});
