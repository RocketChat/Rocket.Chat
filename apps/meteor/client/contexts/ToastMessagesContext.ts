import { createContext, useContext } from 'react';

type ToastMessagePayload = {
	type: 'success' | 'info' | 'warning' | 'error';
	message: string | Error;
	title?: string;
	options?: object;
};

type ToastMessagesContextValue = {
	dispatch: (payload: ToastMessagePayload) => void;
};

export const ToastMessagesContext = createContext<ToastMessagesContextValue>({
	dispatch: () => undefined,
});

export const useToastMessageDispatch = (): ToastMessagesContextValue['dispatch'] => useContext(ToastMessagesContext).dispatch;
