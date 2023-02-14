import { validCallbacks } from '../widget';

export function parentCall(method, args = []) {
	const data = {
		src: 'rocketchat',
		fn: method,
		args,
	};

	// This lgtm ignoring deserves more attention urgently!
	window.parent.postMessage(data, '*'); // lgtm [js/cross-window-information-leak]
}

export const runCallbackEventEmitter = (callbackName, data) =>
	validCallbacks.includes(callbackName) && parentCall('callback', [callbackName, data]);
