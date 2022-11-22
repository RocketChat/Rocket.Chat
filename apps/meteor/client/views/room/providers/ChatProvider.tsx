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

	const chatMessages = useMemo(() => {
		const instance = ChatMessages.get({ rid, tmid }) ?? new ChatMessages({ rid, tmid });
		ChatMessages.set({ rid, tmid }, instance);
		return instance;
	}, [rid, tmid]);

	useEffect(
		() => (): void => {
			ChatMessages.delete({ rid });
		},
		[chatMessages, rid],
	);

	const sendMessage = useSendMessage({ chatMessages, rid, tmid });
	const uploadFiles = useUploadFiles({ tmid });
	const composer = useComposer({ chatMessages });
	const allMessages = useAllMessages();

	const value = useMemo(
		() => Object.assign(chatMessages, { sendMessage, uploadFiles, composer, allMessages }),
		[allMessages, chatMessages, composer, sendMessage, uploadFiles],
	);

	return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export default ChatProvider;
