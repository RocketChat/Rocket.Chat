import { createContext } from 'react';

type ToastMessagePayload = {
	type: 'success' | 'info' | 'warning' | 'error';
	message: string | Error;
	title?: string;
	options?: object;
};

export type ToastMessagesContextValue = {
	dispatch: (payload: ToastMessagePayload) => void;
};

export const ToastMessagesContext = createContext<ToastMessagesContextValue>({
	dispatch: () => undefined,
});
