import React, { ReactElement, ContextType, useMemo, ReactNode } from 'react';
import { useSubscription } from 'use-subscription';

import MessageHighlightContext from '../contexts/MessageHighlightContext';
import { messageHighlightSubscription } from './messageHighlightSubscription';

const MessageHighlightProvider = ({ children }: { children: ReactNode }): ReactElement => {
	const highlightMessageId = useSubscription(messageHighlightSubscription);

	const contextValue = useMemo<ContextType<typeof MessageHighlightContext>>(
		() => ({
			highlightMessageId,
		}),
		[highlightMessageId],
	);

	return <MessageHighlightContext.Provider value={contextValue}>{children}</MessageHighlightContext.Provider>;
};

export default MessageHighlightProvider;
