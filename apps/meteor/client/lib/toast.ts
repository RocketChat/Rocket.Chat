import { Emitter } from '@rocket.chat/emitter';

export type ToastMessagePayload = {
	type: 'success' | 'info' | 'warning' | 'error';
	message: string | Error;
	title?: string;
	options?: object;
};

const emitter = new Emitter<{
	notify: ToastMessagePayload;
}>();

export const dispatchToastMessage = (payload: ToastMessagePayload): void => {
	// TODO: buffer it if there is no subscriber
	emitter.emit('notify', payload);
};

export const subscribeToToastMessages = (callback: (payload: ToastMessagePayload) => void): (() => void) => emitter.on('notify', callback);
