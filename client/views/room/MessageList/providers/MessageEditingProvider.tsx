import React, { ReactElement, ContextType, useMemo } from 'react';
import { useSubscription } from 'use-subscription';

// import { IMessage } from '../../../../../definition/IMessage';
import MessageEditingContext from '../contexts/MessageEditingContext';
import { messageEditingSubscription } from './messageEditingSubscription';

const MessageEditingProvider = ({ children }): ReactElement => {
	// const [editingMessageId, setEditingMessageId] = useState<IMessage['_id'] | undefined>();
	const editingMessageId = useSubscription(messageEditingSubscription);
	console.log(editingMessageId);

	const isEditing = !!editingMessageId;

	const contextValue = useMemo<ContextType<typeof MessageEditingContext>>(
		() => ({
			editingMessageId,
			isEditing,
		}),
		[editingMessageId, isEditing],
	);

	return <MessageEditingContext.Provider value={contextValue}>{children}</MessageEditingContext.Provider>;
};

export default MessageEditingProvider;
