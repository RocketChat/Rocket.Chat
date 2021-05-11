import { createContext, useContext } from 'react';

const openUserCard = () => {
	console.log('openUserCard');
};
const followMessage = () => {
	console.log('followMessage');
};

const openDiscussion = () => {
	console.log('openDiscussion');
};
const openThread = () => {
	console.log('openThread');
};
const replyBroadcast = () => {
	console.log('replyBroadcast');
};

export type MessageContextValue = {
	broadcast: boolean;
	buttons: any[];
	menuButtons: any[];
	actions: {
		openUserCard: () => void;
		followMessage: () => void;
		openDiscussion: () => void;
		openThread: () => void;
		replyBroadcast: () => void;
	};
	formatters: {
		// newDay: (date: Date) => string;
		messageHeader: (date: Date) => string;
	};
	// tabBar: TabBar;
};

export const MessageContext = createContext<MessageContextValue>({
	buttons: [],
	menuButtons: [],
	broadcast: false,
	actions: {
		openUserCard,
		followMessage,
		openDiscussion,
		openThread,
		replyBroadcast,
	},
	formatters: {
		// newDay: (date: Date): string => date.toISOString(),
		messageHeader: (date: Date): string => date.toISOString(),
	},
});

export const useMessageActions = (): MessageContextValue => {
	const context = useContext(MessageContext);
	if (!context) {
		throw Error('useRoom should be used only inside rooms context');
	}
	return context;
};
