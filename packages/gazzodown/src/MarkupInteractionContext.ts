import type { IRoom, IUser } from '@rocket.chat/core-typings';
import type * as MessageParser from '@rocket.chat/message-parser';
import { createContext, FormEvent, UIEvent } from 'react';

export type UserMention = Pick<IUser, '_id' | 'username' | 'name'>;
export type ChannelMention = Pick<IRoom, '_id' | 'name'>;

type MarkupInteractionContextValue = {
	detectEmoji?: (text: string) => { name: string; className: string; image?: string; content: string }[];
	highlightRegex?: () => RegExp;
	onTaskChecked?: (task: MessageParser.Task) => ((e: FormEvent) => void) | undefined;
	resolveUserMention?: (mention: string) => UserMention | undefined;
	onUserMentionClick?: (mentionedUser: UserMention) => ((e: UIEvent) => void) | undefined;
	resolveChannelMention?: (mention: string) => ChannelMention | undefined;
	onChannelMentionClick?: (mentionedChannel: ChannelMention) => ((e: UIEvent) => void) | undefined;
	convertAsciiToEmoji?: boolean;
};

export const MarkupInteractionContext = createContext<MarkupInteractionContextValue>({});
