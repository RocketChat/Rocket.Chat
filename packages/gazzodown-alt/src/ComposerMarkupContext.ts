import { createContext } from 'react';

export type ComposerMarkupContextValue = {
	// Raw text the AST was parsed from, used to recover the markup of nodes with no renderer.
	source?: string;
	// Resolvers keep composer mentions consistent with message-list rendering.
	resolveUserMention?: (mention: string) => { _id: string; username?: string; name?: string } | undefined;
	resolveChannelMention?: (mention: string) => { _id: string; name?: string; fname?: string } | undefined;
};

export const ComposerMarkupContext = createContext<ComposerMarkupContextValue>({});
