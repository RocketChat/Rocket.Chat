import type { ContextType, ReactNode } from 'react';
import { useMemo, useSyncExternalStore } from 'react';

import * as messageHighlightSubscription from './messageHighlightSubscription';
import MessageHighlightContext from '../contexts/MessageHighlightContext';

export type MessageHighlightProviderProps = { children: ReactNode };

const MessageHighlightProvider = ({ children }: MessageHighlightProviderProps) => {
	const highlightMessageId = useSyncExternalStore(messageHighlightSubscription.subscribe, messageHighlightSubscription.getSnapshot);

	const contextValue = useMemo<ContextType<typeof MessageHighlightContext>>(
		() => ({
			highlightMessageId,
		}),
		[highlightMessageId],
	);

	return <MessageHighlightContext.Provider value={contextValue}>{children}</MessageHighlightContext.Provider>;
};

export default MessageHighlightProvider;
