import { createContext, useContext, MouseEvent } from 'react';

import { IMessage } from '../../../../definition/IMessage';

const openUserCard =
	(_username: string) =>
	(_e: MouseEvent<HTMLDivElement>): void => {
		console.log('openUserCard');
	};

const openDiscussion = () => (): void => {
	console.log('openDiscussion');
};
const openThread = () => (): void => console.log('openThread');
const replyBroadcast = (): void => {
	console.log('replyBroadcast');
};
const runActionLink = () => () => (): void => {
	console.log('replyBroadcast');
};

export type MessageContextValue = {
	broadcast: boolean;
	oembedMaxWidth: `${number}px` | '100%';
	// buttons: any[];
	// menuButtons: any[];
	oembedEnabled: boolean;
	actions: {
		openUserCard: (username: string) => (e: MouseEvent<HTMLDivElement>) => void;
		openDiscussion: (drid: string) => () => void;
		openThread: (tmid: string, jump?: string) => () => void;
		runActionLink: (message: IMessage) => (action: string) => () => void;
		replyBroadcast: () => void;
	};
	formatters: {
		// newDay: (date: Date) => string;
		messageHeader: (date: Date) => string;
	};
	// tabBar: TabBar;
};

export const MessageContext = createContext<MessageContextValue>({
	// buttons: [],
	// menuButtons: [],
	oembedEnabled: false,
	oembedMaxWidth: '368px',
	broadcast: false,
	actions: {
		openUserCard,
		openDiscussion,
		openThread,
		runActionLink,
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

export const useMessageRunActionLink = (): ((
	message: IMessage,
) => (action: string) => () => void) => {
	const context = useMessageActions();
	return context.actions.runActionLink;
};

export const useMessageOembedIsEnabled = (): boolean => {
	const context = useMessageActions();
	return context.oembedEnabled;
};

export const useMessageOembedMaxWidth = (): string => {
	const context = useMessageActions();
	return context.oembedMaxWidth;
};
