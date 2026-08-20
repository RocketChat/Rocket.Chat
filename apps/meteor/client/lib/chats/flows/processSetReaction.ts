import type { IMessage } from '@rocket.chat/core-typings';

import { sdk } from '../../../../app/utils/client/lib/SDKClient';
import { Rooms, Subscriptions, Messages } from '../../../stores';
import { emoji } from '../../emoji';
import { roomCoordinator } from '../../rooms/roomCoordinator';
import { dispatchToastMessage } from '../../toast';
import { getUser, getUserId } from '../../user';
import type { ChatAPI } from '../ChatAPI';

const runOptimisticSetReaction = (reaction: string, messageId: IMessage['_id']): void => {
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

export const processSetReaction = async (chat: ChatAPI, { msg }: Pick<IMessage, 'msg'>): Promise<boolean> => {
	const match = msg.trim().match(/^\+(:.*?:)$/m);
	if (!match) {
		return false;
	}

	const [, reaction] = match;
	if (!emoji.list[reaction]) {
		return false;
	}

	const lastMessage = await chat.data.findLastMessage();

	if (!lastMessage) {
		return false;
	}

	chat.composer?.clear();
	runOptimisticSetReaction(reaction, lastMessage._id);
	try {
		await sdk.rest.post('/v1/chat.react', { emoji: reaction, messageId: lastMessage._id });
	} catch (error) {
		dispatchToastMessage({ type: 'error', message: error });
		throw error;
	}
	return true;
};
