import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

export type ToastBarPayload = {
	type?: 'success' | 'info' | 'error';
	message: ReactNode | string | Error;
	title?: string;
	position?: 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';
	time: number;
	id: string;
	isPersistent?: boolean;
};

export type ToastBarContextValue = {
	dispatch: (payload: Omit<ToastBarPayload, 'id' | 'time'> & { time?: number }) => void;
	dismiss: (id: ToastBarPayload['id']) => void;
};

export const ToastBarContext = createContext<ToastBarContextValue>({
	dispatch: () => undefined,
	dismiss: () => undefined,
});

export const useToastBarDispatch = (): ToastBarContextValue['dispatch'] => useContext(ToastBarContext).dispatch;
export const useToastBarDismiss = (): ToastBarContextValue['dismiss'] => useContext(ToastBarContext).dismiss;
