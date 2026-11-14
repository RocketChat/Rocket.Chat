import type { IMessage } from '@rocket.chat/core-typings';
import type { Root } from '@rocket.chat/message-parser';
import type { ComponentType } from 'react';
import { createContext, useContext } from 'react';

import FakeEmoji from './renderers/FakeEmoji';
import FakeMarkup from './renderers/FakeMarkup';
import FakePreviewMarkup from './renderers/FakePreviewMarkup';
import FakeUiKitMessageBlock from './renderers/FakeUiKitMessageBlock';

export type MessageMarkupProps = {
	md: Root;
	/** The source text `md` was parsed from. */
	msg?: string;
	mentions?: IMessage['mentions'];
	channels?: IMessage['channels'];
	searchText?: string;
};

export type MessagePreviewMarkupProps = {
	message: IMessage;
};

export type MessageUiKitBlockProps = {
	rid: IMessage['rid'];
	mid: IMessage['_id'];
	blocks: NonNullable<IMessage['blocks']>;
};

export type MessageEmojiProps = {
	/** The emoji name between colons, such as `:smile:`. */
	emojiHandle: string;
	className?: string;
	fillContainer?: boolean;
};

/**
 * Components that render message content which lives in packages this one cannot depend on: markdown, UiKit blocks and
 * emoji. The defaults are light stand-ins for stories and tests.
 */
export type MessageRenderersContextValue = {
	Markup: ComponentType<MessageMarkupProps>;
	PreviewMarkup: ComponentType<MessagePreviewMarkupProps>;
	UiKitMessageBlock: ComponentType<MessageUiKitBlockProps>;
	Emoji: ComponentType<MessageEmojiProps>;
};

export const messageRenderersDefaultValue: MessageRenderersContextValue = {
	Markup: FakeMarkup,
	PreviewMarkup: FakePreviewMarkup,
	UiKitMessageBlock: FakeUiKitMessageBlock,
	Emoji: FakeEmoji,
};

export const MessageRenderersContext = createContext<MessageRenderersContextValue>(messageRenderersDefaultValue);

export const useMessageRenderers = () => useContext(MessageRenderersContext);
