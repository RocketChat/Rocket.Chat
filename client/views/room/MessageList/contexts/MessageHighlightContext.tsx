import { createContext, useContext } from 'react';

import { IMessage } from '../../../../../definition/IMessage';

type MessageHighlightContextValue = {
	highlightMessageId?: IMessage['_id'];
};

const MessageHighlightContext = createContext<MessageHighlightContextValue>({});

export const useIsMessageHighlight = (_id: IMessage['_id']): boolean => useContext(MessageHighlightContext).highlightMessageId === _id;

export default MessageHighlightContext;
