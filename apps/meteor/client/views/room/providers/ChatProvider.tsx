import type { ReactElement, ReactNode } from 'react';
import React, { useEffect, useMemo } from 'react';

import { ChatMessages } from '../../../../app/ui/client/lib/ChatMessages';
import { ChatContext } from '../contexts/ChatContext';
import { useRoom } from '../contexts/RoomContext';

type ChatProviderProps = {
	children: ReactNode;
	tmid?: string;
};

const ChatProvider = ({ children, tmid }: ChatProviderProps): ReactElement => {
	const { _id: rid } = useRoom();

	const chatMessages = useMemo(() => ChatMessages.hold({ rid, tmid }), [rid, tmid]);

	useEffect(
		() => (): void => {
			ChatMessages.release({ rid, tmid });
		},
		[rid, tmid],
	);

	const value = useMemo(() => chatMessages, [chatMessages]);

	return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export default ChatProvider;
