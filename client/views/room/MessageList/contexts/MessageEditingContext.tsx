import { createContext, useContext } from 'react';

import { IMessage } from '../../../../../definition/IMessage';

type MessageEditingContextValue = {
	editingMessageId?: IMessage['_id'];
};

const MessageEditingContext = createContext<MessageEditingContextValue>({});

export const useIsEditingMessage = (_id: IMessage['_id']): boolean => useContext(MessageEditingContext).editingMessageId === _id;

export default MessageEditingContext;
