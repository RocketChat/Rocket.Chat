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
	// TODO: This lgtm ignoring deserves more attention urgently!
	target.postMessage(data, '*'); // lgtm [js/cross-window-information-leak]
};

export const runCallbackEventEmitter = (callbackName: string, data: unknown) =>
	VALID_CALLBACKS.includes(callbackName) && parentCall('callback', callbackName, data);

export type LivechatMessageEventData<ApiType extends Record<string, any>, Fn extends keyof ApiType = keyof ApiType> = {
	src?: string;
	fn: Fn;
	args: Parameters<ApiType[Fn]>;
};

export const VALID_CALLBACKS = [
	'chat-maximized',
	'chat-minimized',
	'chat-started',
	'chat-ended',
	'pre-chat-form-submit',
	'offline-form-submit',
	'show-widget',
	'hide-widget',
	'assign-agent',
	'agent-status-change',
	'queue-position-change',
	'no-agent-online',
];
