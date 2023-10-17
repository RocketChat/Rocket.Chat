import mitt from 'mitt';

import type { ApiArgs, ApiMethods } from './lib/hooks';

const log =
	process.env.NODE_ENV === 'development'
		? (...args: any) => window.console.log('%cwidget%c', 'color: red', 'color: initial', ...args)
		: () => undefined;

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

// hooks
function callHook<T extends ApiMethods>(action: T, params?: ApiArgs<T>) {
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
		callHook('setExpanded', { expanded: smallScreen });
		callHook('setParentUrl', { parentUrl: window.location.href });
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
				callHook.apply(this, hookParams);
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
	callHook('pageVisited', {
		info: {
			change,
			location: JSON.parse(JSON.stringify(document.location)),
			title: document.title,
		},
	});
}

function setCustomField(key: string, value: string, overwrite: boolean) {
	if (typeof overwrite === 'undefined') {
		overwrite = true;
	}
	callHook('setCustomField', { key, value, overwrite });
}

function setTheme(theme: ApiArgs<'setTheme'>['theme']) {
	callHook('setTheme', { theme });
}

function setDepartment(department: ApiArgs<'setDepartment'>['value']) {
	callHook('setDepartment', { value: department });
}

function setBusinessUnit(businessUnit: ApiArgs<'setBusinessUnit'>['newBusinessUnit']) {
	callHook('setBusinessUnit', { newBusinessUnit: businessUnit });
}

function clearBusinessUnit() {
	callHook('clearBusinessUnit');
}

function setGuestToken(token: ApiArgs<'setGuestToken'>['token']) {
	callHook('setGuestToken', { token });
}

function setGuestName(name: ApiArgs<'setGuestName'>['name']) {
	callHook('setGuestName', { name });
}

function setGuestEmail(email: ApiArgs<'setGuestEmail'>['email']) {
	callHook('setGuestEmail', { email });
}

function registerGuest(guest: ApiArgs<'registerGuest'>['data']) {
	callHook('registerGuest', { data: guest });
}

function clearDepartment() {
	callHook('clearDepartment');
}

function setAgent(agent: ApiArgs<'setAgent'>['agent']) {
	callHook('setAgent', { agent });
}

function setLanguage(language: ApiArgs<'setLanguage'>['language']) {
	callHook('setLanguage', { language });
}

function showWidget() {
	callHook('showWidget');
}

function hideWidget() {
	callHook('hideWidget');
}

function maximizeWidget() {
	callHook('maximizeWidget');
}

function minimizeWidget() {
	callHook('minimizeWidget');
}

function setParentUrl(url?: ApiArgs<'setParentUrl'>['parentUrl']) {
	callHook('setParentUrl', { parentUrl: url });
}

function isDefined<T>(val: T | undefined | null): val is T {
	return val !== undefined && val !== null;
}

function initialize(params: {
	customField?: ApiArgs<'setCustomField'>;
	setCustomFields?: ApiArgs<'setCustomField'>[];
	theme?: ApiArgs<'setTheme'>['theme'];
	department?: ApiArgs<'setDepartment'>['value'];
	businessUnit?: ApiArgs<'setBusinessUnit'>['newBusinessUnit'];
	guestToken?: ApiArgs<'setGuestToken'>['token'];
	guestName?: ApiArgs<'setGuestName'>['name'];
	guestEmail?: ApiArgs<'setGuestEmail'>['email'];
	registerGuest?: ApiArgs<'registerGuest'>['data'];
	language?: ApiArgs<'setLanguage'>['language'];
	agent?: ApiArgs<'setAgent'>['agent'];
	parentUrl?: ApiArgs<'setParentUrl'>['parentUrl'];
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
				const { key, value, overwrite } = param;
				setCustomField(key, value, overwrite);
				continue;
			case 'setCustomFields':
				if (!Array.isArray(params[method])) {
					console.log('Error: Invalid parameters. Value must be an array of objects');
					continue;
				}
				param.forEach((data: ApiArgs<'setCustomField'>) => {
					const { key, value = '', overwrite } = data;
					setCustomField(key, value, overwrite);
				});
				continue;
			case 'theme':
				setTheme(param);
				continue;
			case 'department':
				setDepartment(param);
				continue;
			case 'businessUnit': {
				setBusinessUnit(param);
				continue;
			}
			case 'guestToken':
				setGuestToken(param);
				continue;
			case 'guestName':
				setGuestName(param);
				continue;
			case 'guestEmail':
				setGuestEmail(param);
				continue;
			case 'registerGuest':
				registerGuest(param);
				continue;
			case 'language':
				setLanguage(param);
				continue;
			case 'agent':
				setAgent(param);
				continue;
			case 'parentUrl':
				setParentUrl(param);
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

	const { args } = msg.data;

	// TODO: Refactor widget.js to ts and change their calls to use objects instead of ordered arguments
	log(`api.${msg.data.fn}`, ...args);
	api[fn](args);
}

// (msg) => {
// 	if (typeof msg.data === 'object' && msg.data.src !== undefined && msg.data.src === 'rocketchat') {
// 		if (api[msg.data.fn] !== undefined && typeof api[msg.data.fn] === 'function') {
// 			const args = [].concat(msg.data.args || []);
// 			log(`api.${msg.data.fn}`, ...args);
// 			api[msg.data.fn].apply(null, args);
// 		}
// 	}

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

// exports
window.RocketChat.livechat = {
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

// proccess queue
queue.forEach((c: () => void) => {
	c.call(window.RocketChat.livechat);
});
