import type { IMessage } from '@rocket.chat/core-typings';
import type { UIEvent } from 'react';
import { createContext, useContext } from 'react';

const openUserCard =
	(_username: string) =>
	(_e: UIEvent): void => {
		console.log('openUserCard');
	};

const openRoom = () => (): void => console.log('openRoom');
const openThread = () => (): void => console.log('openThread');
const replyBroadcast = (): void => {
	console.log('replyBroadcast');
};
const runActionLink = () => () => (): void => {
	console.log('replyBroadcast');
};

export type MessageContextValue = {
	actions: {
		openUserCard: (username: string) => (e: UIEvent) => void;
		openRoom: (id: string) => (event: UIEvent) => void;
		openThread: (tmid: string, jump?: string) => (e: UIEvent) => void;
		runActionLink: (message: IMessage) => (action: string) => () => void;
		replyBroadcast: (message: IMessage) => void;
	};
};

export const MessageContext = createContext<MessageContextValue>({
	actions: {
		openUserCard,
		openRoom,
		openThread,
		runActionLink,
		replyBroadcast,
	},
});

export const useMessageContext = (): MessageContextValue => {
	const context = useContext(MessageContext);
	if (!context) {
		throw Error('useMessageContext should be used only inside messages context');
	}
	return context;
};
