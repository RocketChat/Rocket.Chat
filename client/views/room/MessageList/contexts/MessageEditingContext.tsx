import { createContext, useContext } from 'react';

import { IMessage } from '../../../../../definition/IMessage';

type MessageEditingContextValue = {
	editingMessageId?: IMessage['_id'];
	isEditing: boolean;
	// setEditing: (_id: IMessage['_id']) => void;
	// clearEditing: () => void;
};

const initialValue: MessageEditingContextValue = {
	isEditing: false,
	// setEditing: () => undefined,
	// clearEditing: () => undefined,
};

const MessageEditingContext = createContext<MessageEditingContextValue>(initialValue);

export const useIsEditingMessage = (_id: IMessage['_id']): boolean => useContext(MessageEditingContext).editingMessageId === _id;

export default MessageEditingContext;
