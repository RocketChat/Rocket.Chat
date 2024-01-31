import mitt from 'mitt';

import type { ApiArgs, ApiMethods } from './lib/hooks';

const WIDGET_OPEN_WIDTH = 365;
const WIDGET_OPEN_HEIGHT = 525;
const WIDGET_MINIMIZED_WIDTH = 54;
const WIDGET_MINIMIZED_HEIGHT = 54;
const WIDGET_MARGIN = 16;

window.RocketChat = window.RocketChat || { _: [] };
const config: { url?: string } = {};
let widget: HTMLDivElement | null;
let iframe: HTMLIFrameElement | null;
let hookQueue: [[ApiMethods, ApiArgs<ApiMethods>]?] = [];
let ready = false;
let smallScreen = false;
let scrollPosition: number;
let widgetHeight: number;

export const VALIDCALLBACKS = [
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

const callbacks = mitt();

function registerCallback(eventName: string, fn: () => unknown) {
	if (VALIDCALLBACKS.indexOf(eventName) === -1) {
		return false;
	}

	return callbacks.on(eventName, fn);
}

function emitCallback(eventName: string, data?: unknown) {
	if (typeof data !== 'undefined') {
		callbacks.emit(eventName, data);
	} else {
		callbacks.emit(eventName);
	}
}

function clearAllCallbacks() {
	callbacks.all.clear();
}

// hooks
function callHook<T extends ApiMethods>(action: T, params: ApiArgs<T> | [] = []) {
	if (!ready) {
		return hookQueue.push([action, params]);
	}
	if (!iframe?.contentWindow) {
		throw new Error('Widget is not initialized');
	}
	const data = {
		src: 'rocketchat',
		fn: action,
		args: params,
	};
	iframe.contentWindow?.postMessage(data, '*');
}

const updateWidgetStyle = (isOpened: boolean) => {
	if (!iframe || !widget) {
		throw new Error('Widget is not initialized');
	}

	const isFullscreen = smallScreen && widget.dataset.state !== 'triggered';

	if (smallScreen && isOpened) {
		scrollPosition = document.documentElement.scrollTop;
		document.body.classList.add('rc-livechat-mobile-full-screen');
	} else {
		document.body.classList.remove('rc-livechat-mobile-full-screen');
		if (smallScreen) {
			document.documentElement.scrollTop = scrollPosition;
		}
	}

	if (isOpened) {
		widget.style.left = isFullscreen ? '0' : 'auto';

		/**
		 * If we use widget.style.height = smallScreen ? '100vh' : ...
		 * In above case some browser's viewport height is not rendered correctly
		 * so, as 100vh will resolve to 100% of the current viewport height,
		 * so fixed it to 100% avoiding problem for some browsers. Similar resolution
		 * for widget.style.width
		 */

		widget.style.height = isFullscreen ? '100%' : `${WIDGET_MARGIN + widgetHeight + WIDGET_MARGIN + WIDGET_MINIMIZED_HEIGHT}px`;
		widget.style.width = isFullscreen ? '100%' : `${WIDGET_MARGIN + WIDGET_OPEN_WIDTH + WIDGET_MARGIN}px`;
	} else {
		widget.style.left = 'auto';
		widget.style.width = `${WIDGET_MARGIN + WIDGET_MINIMIZED_WIDTH + WIDGET_MARGIN}px`;
		widget.style.height = `${WIDGET_MARGIN + WIDGET_MINIMIZED_HEIGHT + WIDGET_MARGIN}px`;
	}
};

const createWidget = (url: string) => {
	widget = document.createElement('div');
	widget.className = 'rocketchat-widget';
	widget.style.position = 'fixed';
	widget.style.width = `${WIDGET_MARGIN + WIDGET_MINIMIZED_WIDTH + WIDGET_MARGIN}px`;
	widget.style.height = `${WIDGET_MARGIN + WIDGET_MINIMIZED_HEIGHT + WIDGET_MARGIN}px`;
	widget.style.maxHeight = '100vh';
	widget.style.bottom = '0';
	widget.style.right = '0';
	widget.style.zIndex = '12345';
	widget.dataset.state = 'closed';

	const container = document.createElement('div');
	container.className = 'rocketchat-container';
	container.style.width = '100%';
	container.style.height = '100%';

	iframe = document.createElement('iframe');
	iframe.id = 'rocketchat-iframe';
	iframe.src = url;
	iframe.style.width = '100%';
	iframe.style.height = '100%';
	iframe.style.border = 'none';
	iframe.style.backgroundColor = 'transparent';

	container.appendChild(iframe);
	widget.appendChild(container);
	document.body.appendChild(widget);

	const handleMediaQueryTest = ({ matches }: { matches: boolean }) => {
		if (!widget) {
			return;
		}

		smallScreen = matches;
		updateWidgetStyle(widget.dataset.state === 'opened');
		callHook('setExpanded', [smallScreen]);
		callHook('setParentUrl', [window.location.href]);
	};

	const mediaQueryList = window.matchMedia('screen and (max-device-width: 480px)');
	mediaQueryList.addListener(handleMediaQueryTest);
	handleMediaQueryTest(mediaQueryList);
};

const openWidget = () => {
	if (!iframe || !widget) {
		throw new Error('Widget is not initialized');
	}

	if (widget.dataset.state === 'opened') {
		return;
	}

	widgetHeight = WIDGET_OPEN_HEIGHT;
	widget.dataset.state = 'opened';
	updateWidgetStyle(true);
	iframe.focus();
	emitCallback('chat-maximized');
};

const resizeWidget = (height: number) => {
	if (!widget) {
		throw new Error('Widget is not initialized');
	}
	widgetHeight = height;
	widget.dataset.state = 'triggered';
	updateWidgetStyle(true);
};

function closeWidget() {
	if (!iframe || !widget) {
		throw new Error('Widget is not initialized');
	}

	if (widget.dataset.state === 'closed') {
		return;
	}

	widget.dataset.state = 'closed';
	updateWidgetStyle(false);
	emitCallback('chat-minimized');
}

type ApiTypes = {
	popup: Window | null;
	ready: () => void;
	minimizeWindow: () => void;
	restoreWindow: () => void;
	openPopout: () => void;
	openWidget: () => void;
	resizeWidget: (height: number) => void;
	removeWidget: () => void;
	callback: (eventName: string, data?: unknown) => void;
	showWidget: () => void;
	hideWidget: () => void;
	resetDocumentStyle: () => void;
	setFullScreenDocumentMobile: () => void;
};

const api: ApiTypes = {
	popup: null,

	ready() {
		ready = true;
		if (hookQueue.length > 0) {
			hookQueue.forEach(function (hookParams) {
				// There is an existing issue with overload resolution with type union arguments please see https://github.com/microsoft/TypeScript/issues/14107
				// @ts-expect-error: A spread argument must either have a tuple type or be passed to a rest parameter
				callHook(...hookParams);
			});
			hookQueue = [];
		}
	},

	minimizeWindow() {
		closeWidget();
	},

	restoreWindow() {
		if (api.popup && api.popup.closed !== true) {
			api.popup.close();
			api.popup = null;
		}
		openWidget();
	},

	openPopout() {
		closeWidget();
		if (!config.url) {
			throw new Error('Config.url is not set!');
		}
		api.popup = window.open(
			`${config.url}${config.url.lastIndexOf('?') > -1 ? '&' : '?'}mode=popout`,
			'livechat-popout',
			`width=${WIDGET_OPEN_WIDTH}, height=${widgetHeight}, toolbars=no`,
		);
		api.popup?.focus();
	},

	openWidget() {
		openWidget();
	},

	resizeWidget(height: number) {
		resizeWidget(height);
	},

	removeWidget() {
		document.body.removeChild(widget as Node);
	},

	callback(eventName, data) {
		emitCallback(eventName, data);
	},

	showWidget() {
		if (!iframe) {
			throw new Error('Widget is not initialized');
		}
		iframe.style.display = 'initial';
		emitCallback('show-widget');
	},

	hideWidget() {
		if (!iframe) {
			throw new Error('Widget is not initialized');
		}
		iframe.style.display = 'none';
		emitCallback('hide-widget');
	},

	resetDocumentStyle() {
		document.body.classList.remove('rc-livechat-mobile-full-screen');
	},

	setFullScreenDocumentMobile() {
		smallScreen && document.body.classList.add('rc-livechat-mobile-full-screen');
	},
};

function pageVisited(change: string) {
	callHook('pageVisited', [
		{
			change,
			location: JSON.parse(JSON.stringify(document.location)),
			title: document.title,
		},
	]);
}

function setCustomField(key: string, value: string, overwrite: boolean) {
	if (typeof overwrite === 'undefined') {
		overwrite = true;
	}
	if (!key) {
		return;
	}

	callHook('setCustomField', [key, value, overwrite]);
}

function setTheme(theme: ApiArgs<'setTheme'>[0]) {
	callHook('setTheme', [theme]);
}

function setDepartment(department: ApiArgs<'setDepartment'>[0]) {
	callHook('setDepartment', [department]);
}

function setBusinessUnit(businessUnit: ApiArgs<'setBusinessUnit'>[0]) {
	callHook('setBusinessUnit', [businessUnit]);
}

function clearBusinessUnit() {
	callHook('clearBusinessUnit');
}

function setGuestToken(token: ApiArgs<'setGuestToken'>[0]) {
	callHook('setGuestToken', [token]);
}

function setGuestName(name: ApiArgs<'setGuestName'>[0]) {
	callHook('setGuestName', [name]);
}

function setGuestEmail(email: ApiArgs<'setGuestEmail'>[0]) {
	callHook('setGuestEmail', [email]);
}

function registerGuest(guest: ApiArgs<'registerGuest'>[0]) {
	callHook('registerGuest', [guest]);
}

function clearDepartment() {
	callHook('clearDepartment');
}

function setAgent(agent: ApiArgs<'setAgent'>[0]) {
	callHook('setAgent', [agent]);
}

function setLanguage(lang: ApiArgs<'setLanguage'>[0]) {
	callHook('setLanguage', [lang]);
}

function showWidget() {
	callHook('showWidget');
	emitCallback('show-widget');
}

function hideWidget() {
	callHook('hideWidget');
	emitCallback('hide-widget');
}

function maximizeWidget() {
	callHook('maximizeWidget');
	emitCallback('chat-maximized');
}

function minimizeWidget() {
	callHook('minimizeWidget');
	emitCallback('chat-minimized');
}

function setParentUrl(url?: ApiArgs<'setParentUrl'>[0]) {
	callHook('setParentUrl', [url]);
}

function isDefined<T>(val: T | undefined | null): val is T {
	return val !== undefined && val !== null;
}

function initialize(params: {
	customField?: ApiArgs<'setCustomField'>;
	setCustomFields?: ApiArgs<'setCustomField'>[];
	theme?: ApiArgs<'setTheme'>[0];
	department?: ApiArgs<'setDepartment'>[0];
	businessUnit?: ApiArgs<'setBusinessUnit'>[0];
	guestToken?: ApiArgs<'setGuestToken'>[0];
	guestName?: ApiArgs<'setGuestName'>[0];
	guestEmail?: ApiArgs<'setGuestEmail'>[0];
	registerGuest?: ApiArgs<'registerGuest'>[0];
	language?: ApiArgs<'setLanguage'>[0];
	agent?: ApiArgs<'setAgent'>[0];
	parentUrl?: ApiArgs<'setParentUrl'>[0];
}) {
	for (const method in params) {
		if (!params.hasOwnProperty(method)) {
			continue;
		}

		const param = params[method as keyof typeof params];

		if (!isDefined(param)) {
			continue;
		}

		switch (method) {
			case 'customField':
				const customFieldParam = param as ApiArgs<'setCustomField'>;
				const key = customFieldParam[0];
				const value = customFieldParam[1] || '';
				const overwrite = customFieldParam[2];
				setCustomField(key, value, overwrite);
				continue;
			case 'setCustomFields':
				const customFieldsParam = param as ApiArgs<'setCustomField'>[];
				if (!Array.isArray(customFieldsParam)) {
					console.log('Error: Invalid parameters. Value must be an array of objects');
					continue;
				}
				customFieldsParam.forEach((data: ApiArgs<'setCustomField'>) => {
					const key = data[0];
					const value = data[1] || '';
					const overwrite = data[2];
					setCustomField(key, value, overwrite);
				});
				continue;
			case 'theme':
				setTheme(param as ApiArgs<'setTheme'>[0]);
				continue;
			case 'department':
				setDepartment(param as ApiArgs<'setDepartment'>[0]);
				continue;
			case 'businessUnit': {
				setBusinessUnit(param as ApiArgs<'setBusinessUnit'>[0]);
				continue;
			}
			case 'guestToken':
				setGuestToken(param as ApiArgs<'setGuestToken'>[0]);
				continue;
			case 'guestName':
				setGuestName(param as ApiArgs<'setGuestName'>[0]);
				continue;
			case 'guestEmail':
				setGuestEmail(param as ApiArgs<'setGuestEmail'>[0]);
				continue;
			case 'registerGuest':
				registerGuest(param as ApiArgs<'registerGuest'>[0]);
				continue;
			case 'language':
				setLanguage(param as ApiArgs<'setLanguage'>[0]);
				continue;
			case 'agent':
				setAgent(param as ApiArgs<'setAgent'>[0]);
				continue;
			case 'parentUrl':
				setParentUrl(param as ApiArgs<'setParentUrl'>[0]);
				continue;
			default:
				continue;
		}
	}
}

const currentPage: { href: string | null; title: string | null } = {
	href: null,
	title: null,
};

function onNewMessage<T extends ApiMethods>(msg: MessageEvent<{ src?: string; fn: T; args: ApiArgs<T> }>) {
	if (msg.source === msg.target) {
		return;
	}

	if (!msg.data || typeof msg.data !== 'object') {
		return;
	}

	if (!msg.data.src || msg.data.src !== 'rocketchat') {
		return;
	}

	const { fn } = msg.data;

	const args = msg.data.args && !Array.isArray(msg.data.args) ? [msg.data.args] : msg.data.args;

	// There is an existing issue with overload resolution with type union arguments please see https://github.com/microsoft/TypeScript/issues/14107
	// @ts-expect-error: A spread argument must either have a tuple type or be passed to a rest parameter
	api[fn](...args);
}
const attachMessageListener = () => {
	window.addEventListener('message', onNewMessage, false);
};

const trackNavigation = () => {
	setInterval(() => {
		if (document.location.href !== currentPage.href) {
			pageVisited('url');
			currentPage.href = document.location.href;
		}

		if (document.title !== currentPage.title) {
			pageVisited('title');
			currentPage.title = document.title;
		}
	}, 800);
};

const init = (url: string) => {
	const trimmedUrl = url.trim();
	if (!trimmedUrl) {
		return;
	}

	config.url = trimmedUrl;

	createWidget(trimmedUrl);
	attachMessageListener();
	trackNavigation();
};

if (typeof window.initRocket !== 'undefined') {
	console.warn('initRocket is now deprecated. Please update the livechat code.');
	init(window.initRocket[0]);
}

if (typeof window.RocketChat.url !== 'undefined') {
	init(window.RocketChat.url);
}

const queue = window.RocketChat._;

window.RocketChat._.push = function (c: () => void) {
	c.call(window.RocketChat.livechat);
};
window.RocketChat = window.RocketChat._.push;

const livechatWidgetAPI = {
	// methods
	pageVisited,
	setCustomField,
	initialize,
	setTheme,
	setDepartment,
	clearDepartment,
	setGuestToken,
	setGuestName,
	setGuestEmail,
	setAgent,
	registerGuest,
	setLanguage,
	showWidget,
	hideWidget,
	maximizeWidget,
	minimizeWidget,
	setBusinessUnit,
	clearBusinessUnit,
	setParentUrl,
	clearAllCallbacks,

	// callbacks
	onChatMaximized(fn: () => unknown) {
		registerCallback('chat-maximized', fn);
	},
	onChatMinimized(fn: () => unknown) {
		registerCallback('chat-minimized', fn);
	},
	onChatStarted(fn: () => unknown) {
		registerCallback('chat-started', fn);
	},
	onChatEnded(fn: () => unknown) {
		registerCallback('chat-ended', fn);
	},
	onPrechatFormSubmit(fn: () => unknown) {
		registerCallback('pre-chat-form-submit', fn);
	},
	onOfflineFormSubmit(fn: () => unknown) {
		registerCallback('offline-form-submit', fn);
	},
	onWidgetShown(fn: () => unknown) {
		registerCallback('show-widget', fn);
	},
	onWidgetHidden(fn: () => unknown) {
		registerCallback('hide-widget', fn);
	},
	onAssignAgent(fn: () => unknown) {
		registerCallback('assign-agent', fn);
	},
	onAgentStatusChange(fn: () => unknown) {
		registerCallback('agent-status-change', fn);
	},
	onQueuePositionChange(fn: () => unknown) {
		registerCallback('queue-position-change', fn);
	},
	onServiceOffline(fn: () => unknown) {
		registerCallback('no-agent-online', fn);
	},
};

// exports
window.RocketChat.livechat = livechatWidgetAPI;

// proccess queue
queue.forEach((c: () => void) => {
	c.call(window.RocketChat.livechat);
});
