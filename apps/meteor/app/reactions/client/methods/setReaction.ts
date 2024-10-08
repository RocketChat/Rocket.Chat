import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { roomCoordinator } from '../../../../client/lib/rooms/roomCoordinator';
import { emoji } from '../../../emoji/client';
import { Messages, ChatRoom, Subscriptions } from '../../../models/client';

Meteor.methods<ServerMethods>({
	async setReaction(reaction, messageId) {
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

		const room: IRoom | undefined = ChatRoom.findOne({ _id: message.rid });
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
			} else {
				Messages.update({ _id: messageId }, { $set: { reactions: message.reactions } });
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
		}
	},
});
