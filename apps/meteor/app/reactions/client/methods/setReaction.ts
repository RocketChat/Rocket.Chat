import { Meteor } from 'meteor/meteor';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import type { IMessage, IRoom } from '@rocket.chat/core-typings';

import { Messages, Rooms, Subscriptions } from '../../../models/client';
import { callbacks } from '../../../../lib/callbacks';
import { emoji } from '../../../emoji/client';
import { roomCoordinator } from '../../../../client/lib/rooms/roomCoordinator';

Meteor.methods<ServerMethods>({
	setReaction(reaction, messageId) {
		if (!Meteor.userId()) {
			throw new Meteor.Error(203, 'User_logged_out');
		}

		const user = Meteor.user();

		if (!user?.username) {
			return false;
		}

		const message: IMessage | undefined = Messages.findOne({ _id: messageId });
		if (!message) {
			return false;
		}

		const room: IRoom | undefined = Rooms.findOne({ _id: message.rid });
		if (!room) {
			return false;
		}

		if (message.private) {
			return false;
		}

		if (!emoji.list[reaction]) {
			return false;
		}

		if (roomCoordinator.readOnly(room._id, user)) {
			return false;
		}

		if (!Subscriptions.findOne({ rid: message.rid })) {
			return false;
		}

		if (message.reactions?.[reaction] && message.reactions[reaction].usernames.indexOf(user.username) !== -1) {
			message.reactions[reaction].usernames.splice(message.reactions[reaction].usernames.indexOf(user.username), 1);

			if (message.reactions[reaction].usernames.length === 0) {
				delete message.reactions[reaction];
			}

			if (!message.reactions || typeof message.reactions !== 'object' || Object.keys(message.reactions).length === 0) {
				delete message.reactions;
				Messages.update({ _id: messageId }, { $unset: { reactions: 1 } });
				callbacks.run('unsetReaction', messageId, reaction);
			} else {
				Messages.update({ _id: messageId }, { $set: { reactions: message.reactions } });
				callbacks.run('setReaction', messageId, reaction);
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

			Messages.update({ _id: messageId }, { $set: { reactions: message.reactions } });
			callbacks.run('setReaction', messageId, reaction);
		}
	},
});
