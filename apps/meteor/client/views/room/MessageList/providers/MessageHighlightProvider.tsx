import type { ReactElement, ContextType, ReactNode } from 'react';
import React, { useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import MessageHighlightContext from '../contexts/MessageHighlightContext';
import * as messageHighlightSubscription from './messageHighlightSubscription';

const MessageHighlightProvider = ({ children }: { children: ReactNode }): ReactElement => {
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
