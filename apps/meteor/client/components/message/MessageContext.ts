import type { UIEvent } from 'react';
import { createContext, useContext } from 'react';

const openUserCard =
	(_username: string) =>
	(_e: UIEvent): void => {
		console.log('openUserCard');
	};

export type MessageContextValue = {
	actions: {
		openUserCard: (username: string) => (e: UIEvent) => void;
	};
};

export const MessageContext = createContext<MessageContextValue>({
	actions: {
		openUserCard,
	},
});

export const useMessageContext = (): MessageContextValue => {
	const context = useContext(MessageContext);
	if (!context) {
		throw Error('useMessageContext should be used only inside messages context');
	}
	return context;
};
