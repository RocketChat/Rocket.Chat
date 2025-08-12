import type { ReactElement, ReactNode } from 'react';

import { ChatContext } from '../contexts/ChatContext';
import { useRoom } from '../contexts/RoomContext';
import { useChatMessagesInstance } from './hooks/useChatMessagesInstance';

type ChatProviderProps = {
	children: ReactNode;
	tmid?: string;
};

const ChatProvider = ({ children, tmid }: ChatProviderProps): ReactElement => {
	const { _id: rid, encrypted } = useRoom();
	const value = useChatMessagesInstance({ rid, tmid, encrypted });

	return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export default ChatProvider;
