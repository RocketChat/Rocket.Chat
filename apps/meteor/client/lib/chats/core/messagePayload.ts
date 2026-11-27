import { isEncryptedMessageContent, type IEditedMessage, type IMessage, type IRoom } from '@rocket.chat/core-typings';

export type PayloadDeps = {
	prependReplies(text: string, quoted: IMessage[]): Promise<string>;
	randomId(): string;
};

export type ComposeMessageContext = { rid: IRoom['_id']; tmid: IMessage['_id'] | undefined };

export type ComposeMessageOptions = { sendToChannel?: boolean; quotedMessages: IMessage[]; originalMessage?: IMessage };

export const composeMessageCore = async (
	deps: PayloadDeps,
	{ rid, tmid }: ComposeMessageContext,
	text: string,
	{ sendToChannel, quotedMessages, originalMessage }: ComposeMessageOptions,
): Promise<IMessage> => {
	const msg = await deps.prependReplies(text, quotedMessages);

	const effectiveRID = originalMessage?.rid ?? rid;
	const effectiveTMID = originalMessage ? originalMessage.tmid : tmid;

	return {
		_id: originalMessage?._id ?? deps.randomId(),
		rid: effectiveRID,
		...(effectiveTMID && {
			tmid: effectiveTMID,
			...(sendToChannel && { tshow: sendToChannel }),
		}),
		msg,
	} as IMessage;
};

export const getUpdateMessageParams = (message: IEditedMessage, previewUrls?: string[]) =>
	isEncryptedMessageContent(message)
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
