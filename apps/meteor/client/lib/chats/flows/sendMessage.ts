import type { IMessage } from '@rocket.chat/core-typings';

import { KonchatNotification } from '../../../../app/ui/client';
import { t } from '../../../../app/utils/client';
import { dispatchToastMessage } from '../../toast';
import { call } from '../../utils/call';
import type { ChatAPI } from '../ChatAPI';
import { processMessageEditing } from './processMessageEditing';
import { processSetReaction } from './processSetReaction';
import { processSlashCommand } from './processSlashCommand';
import { processTooLongMessage } from './processTooLongMessage';

const process = async (chat: ChatAPI, message: IMessage): Promise<void> => {
	KonchatNotification.removeRoomNotification(message.rid);

	if (await processSetReaction(chat, message)) {
		return;
	}

	if (await processTooLongMessage(chat, message)) {
		return;
	}

	if (await processMessageEditing(chat, message)) {
		return;
	}

	if (await processSlashCommand(chat, message)) {
		return;
	}

	await call('sendMessage', message);
};

export const sendMessage = async (chat: ChatAPI, { text, tshow }: { text: string; tshow?: boolean }): Promise<void> => {
	if (!(await chat.data.isSubscribedToRoom())) {
		try {
			await chat.data.joinRoom();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			return;
		}
	}

	await chat.data.markRoomAsRead();

	text = text.trim();

	if (!text && !chat.currentEditing) {
		// Nothing to do
		return;
	}

	if (text) {
		const message = await chat.data.composeMessage(text, {
			sendToChannel: tshow,
			quotedMessages: chat.composer?.quotedMessages.get() ?? [],
			originalMessage: chat.currentEditing ? await chat.data.findMessageByID(chat.currentEditing.mid) : undefined,
		});

		try {
			await process(chat, message);
			chat.composer?.dismissAllQuotedMessages();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
		return;
	}

	if (chat.currentEditing) {
		const originalMessage = await chat.data.findMessageByID(chat.currentEditing.mid);

		if (!originalMessage) {
			dispatchToastMessage({ type: 'warning', message: t('Message_not_found') });
			return;
		}

		try {
			if (await chat.flows.processMessageEditing({ ...originalMessage, msg: '' })) {
				chat.currentEditing.stop();
				return;
			}

			await chat.currentEditing?.reset();
			await chat.flows.requestMessageDeletion(originalMessage);
			return;
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}
};
