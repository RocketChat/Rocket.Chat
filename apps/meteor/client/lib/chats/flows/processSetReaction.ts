import type { IMessage } from '@rocket.chat/core-typings';

import { emoji } from '../../../../app/emoji/client';
import { runOptimisticSetReaction } from '../../../../app/reactions/client/methods/setReaction';
import { sdk } from '../../../../app/utils/client/lib/SDKClient';
import { dispatchToastMessage } from '../../toast';
import type { ChatAPI } from '../ChatAPI';

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
