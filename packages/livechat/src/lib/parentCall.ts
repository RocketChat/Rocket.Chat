import { VALID_CALLBACKS } from '../widget';

export const parentCall = (method: string, args: any = []) => {
	const data = {
		src: 'rocketchat',
		fn: method,
		args,
	};

	// TODO: This lgtm ignoring deserves more attention urgently!
	window.parent.postMessage(data, '*'); // lgtm [js/cross-window-information-leak]
};

export const runCallbackEventEmitter = (callbackName: string, data: unknown) =>
	VALID_CALLBACKS.includes(callbackName) && parentCall('callback', [callbackName, data]);
