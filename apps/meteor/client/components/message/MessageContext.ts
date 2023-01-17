import type { UIEvent } from 'react';
import { createContext, useContext } from 'react';

const openUserCard =
	(_username: string) =>
	(_e: UIEvent): void => {
		console.log('openUserCard');
	};

const openRoom = () => (): void => console.log('openRoom');

export type MessageContextValue = {
	actions: {
		openUserCard: (username: string) => (e: UIEvent) => void;
		openRoom: (id: string) => (event: UIEvent) => void;
	};
};

export const MessageContext = createContext<MessageContextValue>({
	actions: {
		openUserCard,
		openRoom,
	},
});

export const useMessageContext = (): MessageContextValue => {
	const context = useContext(MessageContext);
	if (!context) {
		throw Error('useMessageContext should be used only inside messages context');
	}
	return context;
};
