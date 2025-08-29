import type { IMessage } from '@rocket.chat/core-typings';

import { sdk } from '../../../../app/utils/client/lib/SDKClient';
import { t } from '../../../../app/utils/lib/i18n';
import { onClientBeforeSendMessage } from '../../onClientBeforeSendMessage';
import { dispatchToastMessage } from '../../toast';
import type { ChatAPI } from '../ChatAPI';
import { processMessageEditing } from './processMessageEditing';
import { processSetReaction } from './processSetReaction';
import { processSlashCommand } from './processSlashCommand';
import { processTooLongMessage } from './processTooLongMessage';

const process = async (chat: ChatAPI, message: IMessage, previewUrls?: string[], isSlashCommandAllowed?: boolean): Promise<void> => {
	const mid = chat.currentEditingMessage.getMID();

	if (await processSetReaction(chat, message)) {
		return;
	}

	if (await processTooLongMessage(chat, message)) {
		return;
	}

	if (isSlashCommandAllowed && (await processSlashCommand(chat, message))) {
		return;
	}

	message = (await onClientBeforeSendMessage({ ...message, isEditing: !!mid })) as IMessage & { isEditing?: boolean };

	// e2e should be a client property only
	delete message.e2e;
	delete (message as IMessage & { isEditing?: boolean }).isEditing;

	if (await processMessageEditing(chat, message, previewUrls)) {
		return;
	}

	await sdk.call('sendMessage', message, previewUrls);
};

export const sendMessage = async (
	chat: ChatAPI,
	{
		text,
		tshow,
		previewUrls,
		isSlashCommandAllowed,
	}: { text: string; tshow?: boolean; previewUrls?: string[]; isSlashCommandAllowed?: boolean },
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

	text = text.trim();
	const mid = chat.currentEditingMessage.getMID();
	if (!text && !mid) {
		// Nothing to do
		return false;
	}

	if (text) {
		const message = await chat.data.composeMessage(text, {
			sendToChannel: tshow,
			quotedMessages: chat.composer?.quotedMessages.get() ?? [],
			originalMessage: mid ? await chat.data.findMessageByID(mid) : null,
		});

		if (mid) {
			const originalMessage = await chat.data.findMessageByID(mid);

			if (
				originalMessage?.t === 'e2e' &&
				originalMessage.attachments &&
				originalMessage.attachments.length > 0 &&
				originalMessage.attachments[0].description !== undefined
			) {
				originalMessage.attachments[0].description = message.msg;
				message.attachments = originalMessage.attachments;
				message.msg = originalMessage.msg;
			}
		}

		try {
			await process(chat, message, previewUrls, isSlashCommandAllowed);
			chat.composer?.dismissAllQuotedMessages();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
		return true;
	}

	if (mid) {
		const originalMessage = await chat.data.findMessageByID(mid);

		if (!originalMessage) {
			dispatchToastMessage({ type: 'warning', message: t('Message_not_found') });
			return false;
		}

		try {
			if (await chat.flows.processMessageEditing({ ...originalMessage, msg: '' }, previewUrls)) {
				chat.currentEditingMessage.stop();
				return false;
			}

			await chat.currentEditingMessage.reset();
			await chat.flows.requestMessageDeletion(originalMessage);
			return false;
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}

	return false;
};
