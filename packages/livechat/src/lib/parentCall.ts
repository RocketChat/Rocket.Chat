import { VALID_CALLBACKS } from '../widget';

const getParentWindowTarget = () => {
	const { opener }: { opener: Window | null } = window;
	if (opener && !opener.closed) {
		return opener;
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
	// TODO: This lgtm ignoring deserves more attention urgently!
	target.postMessage(data, '*'); // lgtm [js/cross-window-information-leak]
};

export const runCallbackEventEmitter = (callbackName: string, data: unknown) =>
	VALID_CALLBACKS.includes(callbackName) && parentCall('callback', callbackName, data);
