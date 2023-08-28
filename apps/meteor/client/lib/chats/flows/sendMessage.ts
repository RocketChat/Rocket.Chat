import type { IMessage } from '@rocket.chat/core-typings';

import { KonchatNotification } from '../../../../app/ui/client/lib/KonchatNotification';
import { sdk } from '../../../../app/utils/client/lib/SDKClient';
import { t } from '../../../../app/utils/lib/i18n';
import { dispatchToastMessage } from '../../toast';
import type { ChatAPI } from '../ChatAPI';
import { processMessageEditing } from './processMessageEditing';
import { processSetReaction } from './processSetReaction';
import { processSlashCommand } from './processSlashCommand';
import { processTooLongMessage } from './processTooLongMessage';

const process = async (chat: ChatAPI, message: IMessage, previewUrls?: string[]): Promise<void> => {
	KonchatNotification.removeRoomNotification(message.rid);

	if (await processSetReaction(chat, message)) {
		return;
	}

	if (await processTooLongMessage(chat, message)) {
		return;
	}

	if (await processMessageEditing(chat, message, previewUrls)) {
		return;
	}

	if (await processSlashCommand(chat, message)) {
		return;
	}

	await sdk.call('sendMessage', message, previewUrls);
};

export const sendMessage = async (
	chat: ChatAPI,
	{ text, tshow, previewUrls }: { text: string; tshow?: boolean; previewUrls?: string[] },
): Promise<boolean> => {
	if (!(await chat.data.isSubscribedToRoom())) {
		try {
			await chat.data.joinRoom();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			return false;
		}
	}

	chat.readStateManager.clearUnreadMark();
	await chat.readStateManager.debouncedMarkAsRead();

	text = text.trim();

	if (!text && !chat.currentEditing) {
		// Nothing to do
		return false;
	}

	if (text) {
		const message = await chat.data.composeMessage(text, {
			sendToChannel: tshow,
			quotedMessages: chat.composer?.quotedMessages.get() ?? [],
			originalMessage: chat.currentEditing ? await chat.data.findMessageByID(chat.currentEditing.mid) : null,
		});

		try {
			await process(chat, message, previewUrls);
			chat.composer?.dismissAllQuotedMessages();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
		return true;
	}

	if (chat.currentEditing) {
		const originalMessage = await chat.data.findMessageByID(chat.currentEditing.mid);

		if (!originalMessage) {
			dispatchToastMessage({ type: 'warning', message: t('Message_not_found') });
			return false;
		}

		try {
			if (await chat.flows.processMessageEditing({ ...originalMessage, msg: '' }, previewUrls)) {
				chat.currentEditing.stop();
				return false;
			}

			await chat.currentEditing?.reset();
			await chat.flows.requestMessageDeletion(originalMessage);
			return false;
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}

	return false;
};
