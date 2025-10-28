import type { ReactNode } from 'react';
import { createContext } from 'react';

type ToastMessagePayload =
	| {
			type: 'success' | 'info' | 'warning';
			message: ReactNode | string;
			title?: string;
			options?: object;
	  }
	| {
			type: 'error';
			message: unknown;
			title?: string;
			options?: object;
	  };

export type ToastMessagesContextValue = {
	dispatch: (payload: ToastMessagePayload) => void;
};

export const ToastMessagesContext = createContext<ToastMessagesContextValue>({
	dispatch: () => undefined,
});
