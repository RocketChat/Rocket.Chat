import type { IMessage, ITranslatedMessage } from '@rocket.chat/core-typings';
import type { Root } from '@rocket.chat/message-parser';
import { createContext, useContext } from 'react';

export type NormalizedMessage<TMessage extends IMessage = IMessage> = Omit<TMessage & Partial<ITranslatedMessage>, 'md'> & {
	md: Root;
	/** The exact source text `md` was parsed from. */
	mdSource?: string;
};

export type EmojiData = {
	name: string;
	/** CSS class of a sprite emoji. */
	className?: string;
	/** CSS background image of a custom emoji. */
	image?: string;
	/** The emoji as text. */
	content?: string;
};

/**
 * Turns a message into what is displayed: markdown parsed with the viewer's options, attachments decrypted, translations
 * applied.
 */
export type MessageContentContextValue = {
	useNormalizedMessage: <TMessage extends IMessage>(message: TMessage) => NormalizedMessage<TMessage>;
	getEmojiData: (name: string) => EmojiData;
};

const plainParagraph = (text: string): Root => [{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: text }] }];

export const messageContentDefaultValue: MessageContentContextValue = {
	useNormalizedMessage: <TMessage extends IMessage>(message: TMessage) =>
		({ ...message, md: message.md ?? plainParagraph(message.msg), mdSource: message.msg }) as NormalizedMessage<TMessage>,
	getEmojiData: (name) => ({ name, content: name }),
};

export const MessageContentContext = createContext<MessageContentContextValue>(messageContentDefaultValue);

export const useMessageContent = () => useContext(MessageContentContext);
