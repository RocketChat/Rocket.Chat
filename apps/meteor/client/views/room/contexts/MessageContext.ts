import type { IMessage } from '@rocket.chat/core-typings';
import type { CSSProperties, UIEvent } from 'react';
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
	broadcast: boolean;
	oembedMaxWidth: number | '100%';
	oembedMaxHeight: number;
	oembedEnabled: boolean;
	actions: {
		openUserCard: (username: string) => (e: UIEvent) => void;
		openRoom: (id: string) => (event: UIEvent) => void;
		openThread: (tmid: string, jump?: string) => (e: UIEvent) => void;
		runActionLink: (message: IMessage) => (action: string) => () => void;
		replyBroadcast: (message: IMessage) => void;
	};
	formatters: {
		time: (date: Date) => string;
		dateAndTime: (date: Date) => string;
	};
};

export const MessageContext = createContext<MessageContextValue>({
	oembedEnabled: false,
	oembedMaxWidth: 368,
	oembedMaxHeight: 368,
	broadcast: false,
	actions: {
		openUserCard,
		openRoom,
		openThread,
		runActionLink,
		replyBroadcast,
	},
	formatters: {
		time: (date: Date): string => date.toISOString(),
		dateAndTime: (date: Date): string => date.toISOString(),
	},
});

export const useMessageActions = (): MessageContextValue => {
	const context = useContext(MessageContext);
	if (!context) {
		throw Error('useMessageActions should be used only inside messages context');
	}
	return context;
};

export const useMessageRunActionLink = (): ((message: IMessage) => (action: string) => () => void) => {
	const context = useMessageActions();
	return context.actions.runActionLink;
};

export const useMessageOembedIsEnabled = (): boolean => {
	const context = useMessageActions();
	return context.oembedEnabled;
};

export const useMessageOembedMaxWidth = (): CSSProperties['width'] => {
	const context = useMessageActions();
	return context.oembedMaxWidth;
};

export const useMessageOembedMaxHeight = (): CSSProperties['height'] => {
	const context = useMessageActions();
	return context.oembedMaxHeight;
};
