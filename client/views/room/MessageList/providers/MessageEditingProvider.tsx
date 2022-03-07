import React, { ReactElement, ContextType, useMemo, ReactNode } from 'react';
import { useSubscription } from 'use-subscription';

import MessageEditingContext from '../contexts/MessageEditingContext';
import { messageEditingSubscription } from './messageEditingSubscription';

const MessageEditingProvider = ({ children }: { children: ReactNode }): ReactElement => {
	const editingMessageId = useSubscription(messageEditingSubscription);

	const contextValue = useMemo<ContextType<typeof MessageEditingContext>>(
		() => ({
			editingMessageId,
		}),
		[editingMessageId],
	);

	return <MessageEditingContext.Provider value={contextValue}>{children}</MessageEditingContext.Provider>;
};

export default MessageEditingProvider;
