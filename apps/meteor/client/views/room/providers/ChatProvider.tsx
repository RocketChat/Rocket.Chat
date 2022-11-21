import { IMessage } from '@rocket.chat/core-typings';
import { Mongo } from 'meteor/mongo';
import React, { ReactElement, ReactNode, useEffect, useMemo } from 'react';

import { Messages } from '../../../../app/models/client';
import { ChatMessages } from '../../../../app/ui/client/lib/ChatMessages';
import { ChatContext } from '../contexts/ChatContext';
import { useRoom } from '../contexts/RoomContext';
import { useComposer } from './hooks/useComposer';
import { useSendMessage } from './hooks/useSendMessage';

type ChatProviderProps = {
	children: ReactNode;
	tmid?: string;
};

const useAllMessages = (): {
	readonly findOneByID: (mid: IMessage['_id']) => Promise<IMessage | undefined>;
	readonly getOneByID: (mid: IMessage['_id']) => Promise<IMessage>;
} =>
	useMemo(() => {
		const findOneByID = async (mid: IMessage['_id']): Promise<IMessage | undefined> =>
			(Messages as Mongo.Collection<IMessage>).findOne({ _id: mid }, { reactive: false });

		const getOneByID = async (mid: IMessage['_id']): Promise<IMessage> => {
			const message = await findOneByID(mid);

			if (!message) {
				throw new Error('Message not found');
			}

			return message;
		};

		return {
			findOneByID,
			getOneByID,
		} as const;
	}, []);

const ChatProvider = ({ children, tmid }: ChatProviderProps): ReactElement => {
	const { _id: rid } = useRoom();

	const chatMessagesInstance = useMemo(() => {
		const instance = ChatMessages.get({ rid, tmid }) ?? new ChatMessages({ rid, tmid });
		ChatMessages.set({ rid, tmid }, instance);
		return instance;
	}, [rid, tmid]);

	useEffect(
		() => (): void => {
			ChatMessages.delete({ rid });
		},
		[chatMessagesInstance, rid],
	);

	const sendMessage = useSendMessage({ chatMessages: chatMessagesInstance, rid, tmid });
	const composer = useComposer({ chatMessages: chatMessagesInstance });
	const allMessages = useAllMessages();

	const value = useMemo(
		() => Object.assign(chatMessagesInstance, { sendMessage, composer, allMessages }),
		[allMessages, chatMessagesInstance, composer, sendMessage],
	);

	return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export default ChatProvider;
