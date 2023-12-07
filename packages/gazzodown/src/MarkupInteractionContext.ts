import type { MessageMention } from '@rocket.chat/core-typings';
import type * as MessageParser from '@rocket.chat/message-parser';
import { createContext, FormEvent, UIEvent } from 'react';

export type UserMention = MessageMention;
export type ChannelMention = MessageMention;

type MarkupInteractionContextValue = {
	detectEmoji?: (text: string) => { name: string; className: string; image?: string; content: string }[];
	highlightRegex?: () => RegExp;
	markRegex?: () => RegExp;
	onTaskChecked?: (task: MessageParser.Task) => ((e: FormEvent) => void) | undefined;
	resolveUserMention?: (mention: string) => MessageMention | undefined;
	onUserMentionClick?: (mentionedUser: MessageMention) => ((e: UIEvent) => void) | undefined;
	resolveChannelMention?: (mention: string) => MessageMention | undefined;
	onChannelMentionClick?: (mentionedChannel: MessageMention) => ((e: UIEvent) => void) | undefined;
	convertAsciiToEmoji?: boolean;
	useEmoji?: boolean;
	useRealName?: boolean;
	isMobile?: boolean;
	ownUserId?: string | null;
	showMentionSymbol?: boolean;
};

export const MarkupInteractionContext = createContext<MarkupInteractionContextValue>({});
