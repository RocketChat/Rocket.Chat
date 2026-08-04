import type { IMessage } from '@rocket.chat/core-typings';

import { roomCoordinator } from '../../../../client/lib/rooms/roomCoordinator';
import { getUser, getUserId } from '../../../../client/lib/user';
import { Rooms, Subscriptions, Messages } from '../../../../client/stores';
import { emoji } from '../../../emoji/client';

export const runOptimisticSetReaction = (reaction: string, messageId: IMessage['_id']): void => {
	if (!getUserId()) {
		return;
	}

	const user = getUser();
	if (!user?.username) {
		return;
	}

	const message: IMessage | undefined = Messages.state.get(messageId);
	if (!message) {
		return;
	}

	const room = Rooms.state.get(message.rid);
	if (!room) {
		return;
	}

	if (message.private) {
		return;
	}

	if (!emoji.list[reaction]) {
		return;
	}

	if (roomCoordinator.readOnly(room, user)) {
		return;
	}

	if (!Subscriptions.state.find(({ rid }) => rid === message.rid)) {
		return;
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
			return;
		}

		Messages.state.update(
			(record) => record._id === messageId,
			(record) => ({ ...record, reactions: message.reactions }),
		);
		return;
	}

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
};
