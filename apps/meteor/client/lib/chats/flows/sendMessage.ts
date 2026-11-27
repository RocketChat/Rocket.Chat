import type { IMessage } from '@rocket.chat/core-typings';

import { afterSendMessageCallback } from './afterSendMessageCallback';
import { processMessageEditing } from './processMessageEditing';
import { processMessageUploads } from './processMessageUploads';
import { processSetReaction } from './processSetReaction';
import { processSlashCommand } from './processSlashCommand';
import { processTooLongMessage } from './processTooLongMessage';
import { t } from '../../../../lib/i18n';
import { trim } from '../../../../lib/utils/stringUtils';
import { Messages, Rooms } from '../../../stores';
import { sdk } from '../../SDKClient';
import { onClientBeforeSendMessage } from '../../onClientBeforeSendMessage';
import { onClientMessageReceived } from '../../onClientMessageReceived';
import { settings } from '../../settings';
import { dispatchToastMessage } from '../../toast';
import { getUserId, getUser } from '../../user';
import { upsertThreadMessageInCache } from '../../utils/threadMessageUtils';
import type { ChatAPI } from '../ChatAPI';
import { sendMessageCore } from '../core/sendMessage';

export const sendMessage = (
	chat: ChatAPI,
	params: { text: string; tshow?: boolean; previewUrls?: string[]; isSlashCommandAllowed?: boolean; tmid?: IMessage['tmid'] },
): Promise<boolean> =>
	sendMessageCore<ChatAPI>(
		{
			getUserId: () => getUserId(),
			getUser: () => getUser(),
			trim: (text) => trim(text),
			getMessage: (id) => Messages.state.get(id),
			storeMessage: (message) => Messages.state.store(message),
			updateMessage: (predicate, modifier) => Messages.state.update(predicate, modifier),
			getRoom: (rid) => Rooms.state.get(rid),
			isReadReceiptEnabled: () => settings.peek('Message_Read_Receipt_Enabled'),
			onClientMessageReceived: (message) => onClientMessageReceived(message),
			onClientBeforeSendMessage: (message) => onClientBeforeSendMessage(message),
			upsertThreadMessage: (message, rid, tmid) => upsertThreadMessageInCache(message, rid, tmid),
			postMessage: (body) => sdk.rest.post('/v1/chat.sendMessage', body),
			afterSendMessage: (message, rid) => afterSendMessageCallback(message, rid),
			notifyError: (error) => dispatchToastMessage({ type: 'error', message: error }),
			notifyAlreadySent: () => dispatchToastMessage({ type: 'error', message: t('Message_Already_Sent') }),
			notifyMessageNotFound: () => dispatchToastMessage({ type: 'warning', message: t('Message_not_found') }),
			flows: {
				processSetReaction: (target, message) => processSetReaction(target, message),
				processTooLongMessage: (target, message) => processTooLongMessage(target, message),
				processSlashCommand: (target, message) => processSlashCommand(target, message),
				processMessageUploads: (target, message) => processMessageUploads(target, message),
				processMessageEditing: (target, message, previewUrls) => processMessageEditing(target, message, previewUrls),
			},
		},
		chat,
		params,
	);
