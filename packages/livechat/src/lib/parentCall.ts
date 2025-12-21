import { VALID_CALLBACKS } from '../widget';
import { store } from '../store';

const getParentWindowTarget = () => {
	if (window.opener && !window.opener.closed) {
		return window.opener;
	}

	return window.parent;
};

export const parentCall = (method: string, ...args: any[]) => {
	const data = {
		src: 'rocketchat',
		fn: method,
		args,
	};

	const target = getParentWindowTarget();
	let origin;
	if (store.state.parentUrl) {
		try {
			origin = new URL(store.state.parentUrl).origin;
		} catch {}
	}
	if (origin) {
		target.postMessage(data, origin);
	}
};

export const runCallbackEventEmitter = (callbackName: string, data: unknown) =>
	VALID_CALLBACKS.includes(callbackName) && parentCall('callback', callbackName, data);
