import type { IMessage } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { roomCoordinator } from '../../../../client/lib/rooms/roomCoordinator';
import { Rooms, Subscriptions, Messages } from '../../../../client/stores';
import { emoji } from '../../../emoji/client';

Meteor.methods<ServerMethods>({
	async setReaction(reaction, messageId) {
		if (!Meteor.userId()) {
			throw new Meteor.Error(203, 'User_logged_out');
		}

		const user = Meteor.user();

		if (!user?.username) {
			return false;
		}

		const message: IMessage | undefined = Messages.state.get(messageId);
		if (!message) {
			return false;
		}

		const room = Rooms.state.get(message.rid);
		if (!room) {
			return false;
		}

		if (message.private) {
			return false;
		}

		if (!emoji.list[reaction]) {
			return false;
		}

		if (roomCoordinator.readOnly(room, user)) {
			return false;
		}

		if (!Subscriptions.state.find(({ rid }) => rid === message.rid)) {
			return false;
		}

		if (message.reactions?.[reaction] && message.reactions[reaction].usernames.indexOf(user.username) !== -1) {
			message.reactions[reaction].usernames.splice(message.reactions[reaction].usernames.indexOf(user.username), 1);

			if (message.reactions[reaction].usernames.length === 0) {
				delete message.reactions[reaction];
			}

			if (!message.reactions || typeof message.reactions !== 'object' || Object.keys(message.reactions).length === 0) {
				delete message.reactions;
				Messages.state.update(
					(record) => record._id === messageId,
					({ reactions: _, ...record }) => record,
				);
			} else {
				Messages.state.update(
					(record) => record._id === messageId,
					(record) => ({ ...record, reactions: message.reactions }),
				);
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

			Messages.state.update(
				(record) => record._id === messageId,
				(record) => ({ ...record, reactions: message.reactions }),
			);
		}
	},
});
