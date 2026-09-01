import type { IMessage } from '@rocket.chat/core-typings';

import { Rooms, Subscriptions, Messages } from '../../../stores';
import { sdk } from '../../SDKClient';
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

	const { username } = user;

	Messages.state.update(
		(record) => record._id === messageId,
		(record) => {
			const currentReactions = record.reactions ?? {};
			const hasReacted = currentReactions[reaction]?.usernames.includes(username) ?? false;

			const reactions: NonNullable<IMessage['reactions']> = {};

			for (const [name, value] of Object.entries(currentReactions)) {
				if (name !== reaction) {
					reactions[name] = value;
					continue;
				}

				const usernames = hasReacted ? value.usernames.filter((u) => u !== username) : [...value.usernames, username];

				if (usernames.length > 0) {
					reactions[name] = { ...value, usernames };
				}
			}

			if (!currentReactions[reaction]) {
				reactions[reaction] = { usernames: [username] };
			}

			if (Object.keys(reactions).length === 0) {
				const { reactions: _, ...rest } = record;
				return rest;
			}

			return { ...record, reactions };
		},
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
