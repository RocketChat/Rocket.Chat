// Oracle for the differential spec: the logic as it was before the extraction; never import it from product code.
import { isEncryptedMessageContent, type IEditedMessage, type IMessage, type IRoom } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';

import { sdk } from '../SDKClient';
import { prependReplies } from '../utils/prependReplies';

type LegacyComposeOptions = { sendToChannel?: boolean; quotedMessages: IMessage[]; originalMessage?: IMessage | null };

export const legacyComposeMessage = async (
	{ rid, tmid }: { rid: IRoom['_id']; tmid: IMessage['_id'] | undefined },
	text: string,
	{ sendToChannel, quotedMessages, originalMessage }: LegacyComposeOptions,
): Promise<IMessage> => {
	const msg = await prependReplies(text, quotedMessages);

	const effectiveRID = originalMessage?.rid ?? rid;
	const effectiveTMID = originalMessage ? originalMessage.tmid : tmid;

	return {
		_id: originalMessage?._id ?? Random.id(),
		rid: effectiveRID,
		...(effectiveTMID && {
			tmid: effectiveTMID,
			...(sendToChannel && { tshow: sendToChannel }),
		}),
		msg,
	} as IMessage;
};

export const legacyUpdateMessage = async (message: IEditedMessage, previewUrls?: string[]): Promise<void> => {
	const params = isEncryptedMessageContent(message)
		? {
				msgId: message._id,
				roomId: message.rid,
				content: message.content,
				e2eMentions: message.e2eMentions,
			}
		: {
				previewUrls,
				msgId: message._id,
				roomId: message.rid,
				customFields: message.customFields,
				text: message.msg,
			};

	await sdk.rest.post('/v1/chat.update', params);
};
