import { createContext } from 'react';

export type ComposerMarkupContextValue = {
	// Raw text the AST was parsed from, used to recover the markup of nodes with no renderer.
	source?: string;
	// TODO: renderComposerMarkup does not supply these yet, so mentions render as raw @name/#name.
	// Composer mentions must resolve exactly as the message list does before GA.
	resolveUserMention?: (mention: string) => { _id: string; username?: string; name?: string } | undefined;
	resolveChannelMention?: (mention: string) => { _id: string; name?: string; fname?: string } | undefined;
};

export const ComposerMarkupContext = createContext<ComposerMarkupContextValue>({});
