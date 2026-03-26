import { createContext } from 'react';

export type ComposerMarkupContextValue = {
	detectEmoji?: (text: string) => { name: string; className: string; image?: string; content: string }[];
	resolveUserMention?: (mention: string) => { _id: string; username?: string; name?: string } | undefined;
	resolveChannelMention?: (mention: string) => { _id: string; name?: string; fname?: string } | undefined;
	convertAsciiToEmoji?: boolean;
	useEmoji?: boolean;
};

export const ComposerMarkupContext = createContext<ComposerMarkupContextValue>({});
