import React, { ReactElement, ReactNode, useEffect, useMemo } from 'react';

import { ChatMessages } from '../../../../app/ui/client/lib/ChatMessages';
import { ChatContext } from '../contexts/ChatContext';
import { useRoom } from '../contexts/RoomContext';
import { useAllMessages } from './hooks/useAllMessages';
import { useComposer } from './hooks/useComposer';
import { useSendMessage } from './hooks/useSendMessage';
import { useUploadFiles } from './hooks/useUploadFiles';

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

	const composer = useComposer({ chatMessages });
	const allMessages = useAllMessages();
	const sendMessage = useSendMessage({ chatMessages, tmid });
	const uploadFiles = useUploadFiles({ chatMessages, tmid, composer });

	const value = useMemo(
		() => Object.assign(chatMessages, { composer, allMessages, sendMessage, uploadFiles }),
		[allMessages, chatMessages, composer, sendMessage, uploadFiles],
	);

	return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export default ChatProvider;
