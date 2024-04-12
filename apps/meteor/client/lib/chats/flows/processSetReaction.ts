import type { IMessage } from '@rocket.chat/core-typings';

import { emoji } from '../../../../app/emoji/client';
import { callWithErrorHandling } from '../../utils/callWithErrorHandling';
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

	await callWithErrorHandling('setReaction', reaction, lastMessage._id);
	return true;
};
