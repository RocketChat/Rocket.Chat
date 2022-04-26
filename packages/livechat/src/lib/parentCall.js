import { validCallbacks } from '../widget';

export function parentCall(method, args = []) {
	const data = {
		src: 'rocketchat',
		fn: method,
		args,
	};

	window.parent.postMessage(data, '*');
}

export const runCallbackEventEmitter = (callbackName, data) => validCallbacks.includes(callbackName) && parentCall('callback', [callbackName, data]);
