import { createContext } from 'react';

export type ComposerMarkupContextValue = {
	detectEmoji?: (text: string) => { name: string; className: string; image?: string; content: string }[];
	// TODO: renderComposerMarkup does not supply these yet, so mentions render as raw @name/#name.
	// Composer mentions must resolve exactly as the message list does before GA.
	resolveUserMention?: (mention: string) => { _id: string; username?: string; name?: string } | undefined;
	resolveChannelMention?: (mention: string) => { _id: string; name?: string; fname?: string } | undefined;
};

export const ComposerMarkupContext = createContext<ComposerMarkupContextValue>({});
