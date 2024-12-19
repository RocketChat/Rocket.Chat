import type { UserStatus } from '@rocket.chat/core-typings';
import type { LivechatRoomEvents } from '@rocket.chat/ddp-client';
import { Emitter } from '@rocket.chat/emitter';

import { isDefined } from './helpers/isDefined';
import type { HooksWidgetAPI } from './lib/hooks';
import type { StoreState } from './store';

type InternalWidgetAPI = {
	popup: Window | null;
	ready: () => void;
	minimizeWindow: () => void;
	restoreWindow: () => void;
	openPopout: (token?: string) => void;
	openWidget: () => void;
	resizeWidget: (height: number) => void;
	removeWidget: () => void;
	callback: (eventName: string, data?: unknown) => void;
	showWidget: () => void;
	hideWidget: () => void;
	resetDocumentStyle: () => void;
	setFullScreenDocumentMobile: () => void;
	setWidgetPosition: (position: 'left' | 'right') => void;
};

export type LivechatMessageEventData<ApiType extends Record<string, any>> = {
	src?: string;
	fn: keyof ApiType;
	args: Parameters<ApiType[keyof ApiType]>;
};

type InitializeParams = {
	customField: [key: string, value: string, overwrite?: boolean];
	setCustomFields: [key: string, value: string, overwrite?: boolean][];
	theme: StoreState['iframe']['theme'];
	department: string;
	businessUnit: string;
	guestToken: string;
	guestName: string;
	guestEmail: string;
	registerGuest: StoreState['guest'];
	language: string;
	agent: StoreState['defaultAgent'];
	parentUrl: string;
	setGuestMetadata: StoreState['iframe']['guestMetadata'];
	hiddenSystemMessages: StoreState['iframe']['hiddenSystemMessages'];
};

const WIDGET_OPEN_WIDTH = 365;
const WIDGET_OPEN_HEIGHT = 525;
const WIDGET_MINIMIZED_WIDTH = 54;
const WIDGET_MINIMIZED_HEIGHT = 54;
const WIDGET_MARGIN = 16;

window.RocketChat = window.RocketChat || { _: [] };
const config: { url?: string } = {};
let widget: HTMLDivElement | null;
let iframe: HTMLIFrameElement | null;
let hookQueue: [keyof HooksWidgetAPI, Parameters<HooksWidgetAPI[keyof HooksWidgetAPI]>][] = [];
let ready = false;
let smallScreen = false;
let scrollPosition: number;
let widgetHeight: number;

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

const VALID_SYSTEM_MESSAGES = ['uj', 'ul', 'livechat-close', 'livechat-started', 'livechat_transfer_history'];

const callbacks = new Emitter();

function registerCallback(eventName: string, fn: () => unknown) {
	if (VALID_CALLBACKS.indexOf(eventName) === -1) {
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
	callbacks.events().forEach((callback) => {
		callbacks.off(callback, () => undefined);
	});
}

// hooks
function callHook(action: keyof HooksWidgetAPI, ...params: Parameters<HooksWidgetAPI[keyof HooksWidgetAPI]>) {
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

function processHookQueue() {
	if (!hookQueue.length) {
		return;
	}

	hookQueue.forEach(([action, params = []]) => {
		callHook(action, ...params);
	});

	hookQueue = [];
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
	widget.style.left = '0';
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
		callHook('setExpanded', smallScreen);
		callHook('setParentUrl', window.location.href);
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

const setWidgetPosition = (position: 'left' | 'right' = 'right') => {
	if (!widget) {
		throw new Error('Widget is not initialized');
	}

	widget.style.left = position === 'left' ? '0' : 'auto';
	widget.style.right = position !== 'left' ? '0' : 'auto';
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

function pageVisited(change: string) {
	callHook('pageVisited', {
		change,
		location: JSON.parse(JSON.stringify(document.location)),
		title: document.title,
	});
}

function setCustomField(key: string, value = '', overwrite = true) {
	if (typeof overwrite === 'undefined') {
		overwrite = true;
	}
	if (!key) {
		return;
	}

	callHook('setCustomField', key, value, overwrite);
}

function setCustomFields(fields: [key: string, value: string, overwrite?: boolean][]) {
	if (!Array.isArray(fields)) {
		console.log('Error: Invalid parameters. Value must be an array of objects');
		return;
	}

	fields.forEach(([key, value, overwrite = true]) => {
		setCustomField(key, value, overwrite);
	});
}

function setTheme(theme: StoreState['iframe']['theme']) {
	if (theme?.position !== 'left' && theme?.position !== 'right') {
		if (theme?.position) {
			console.warn(`Error: Position "${theme?.position}" is invalid. It must be "left" or "right"`);
		}

		delete theme.position;
	}

	callHook('setTheme', theme);
}

function setDepartment(department: string) {
	callHook('setDepartment', department);
}

function setBusinessUnit(businessUnit: string) {
	callHook('setBusinessUnit', businessUnit);
}

function clearBusinessUnit() {
	callHook('clearBusinessUnit');
}

function setGuestToken(token: string) {
	callHook('setGuestToken', token);
}

function setGuestName(name: string) {
	callHook('setGuestName', name);
}

function setGuestEmail(email: string) {
	callHook('setGuestEmail', email);
}

function registerGuest(guest: StoreState['guest']) {
	callHook('registerGuest', guest);
}

function clearDepartment() {
	callHook('clearDepartment');
}

function setAgent(agent: StoreState['defaultAgent']) {
	callHook('setAgent', agent);
}

function setLanguage(lang: string) {
	callHook('setLanguage', lang);
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

function setParentUrl(url: string) {
	callHook('setParentUrl', url);
}

function transferChat(department: string) {
	callHook('transferChat', department);
}

function setGuestMetadata(metadata: StoreState['iframe']['guestMetadata']) {
	if (typeof metadata !== 'object') {
		throw new Error('Invalid metadata');
	}

	callHook('setGuestMetadata', metadata);
}

function setHiddenSystemMessages(hidden: StoreState['iframe']['hiddenSystemMessages']) {
	if (!Array.isArray(hidden)) {
		throw new Error('Error: Invalid parameters. Value must be an array of strings');
	}

	const hiddenSystemMessages = hidden.filter((h) => {
		if (VALID_SYSTEM_MESSAGES.includes(h)) {
			return true;
		}

		console.warn(`Error: Invalid system message "${h}"`);
		return false;
	});

	callHook('setHiddenSystemMessages', hiddenSystemMessages);
}

function initialize(initParams: Partial<InitializeParams>) {
	for (const initKey in initParams) {
		if (!initParams.hasOwnProperty(initKey)) {
			continue;
		}

		const params = initParams[initKey as keyof InitializeParams];

		if (!isDefined(params)) {
			continue;
		}

		switch (initKey) {
			case 'customField':
				setCustomField(...(params as InitializeParams['customField']));
				continue;
			case 'setCustomFields':
				setCustomFields(params as InitializeParams['setCustomFields']);
				continue;
			case 'theme':
				setTheme(params as InitializeParams['theme']);
				continue;
			case 'department':
				setDepartment(params as InitializeParams['department']);
				continue;
			case 'businessUnit':
				setBusinessUnit(params as InitializeParams['businessUnit']);
				continue;
			case 'guestToken':
				setGuestToken(params as InitializeParams['guestToken']);
				continue;
			case 'guestName':
				setGuestName(params as InitializeParams['guestName']);
				continue;
			case 'guestEmail':
				setGuestEmail(params as InitializeParams['guestEmail']);
				continue;
			case 'registerGuest':
				registerGuest(params as InitializeParams['registerGuest']);
				continue;
			case 'language':
				setLanguage(params as InitializeParams['language']);
				continue;
			case 'agent':
				setAgent(params as InitializeParams['agent']);
				continue;
			case 'parentUrl':
				setParentUrl(params as InitializeParams['parentUrl']);
				continue;
			case 'setGuestMetadata':
				setGuestMetadata(params as InitializeParams['setGuestMetadata']);
				continue;
			case 'hiddenSystemMessages':
				setHiddenSystemMessages(params as InitializeParams['hiddenSystemMessages']);
				continue;
			default:
				continue;
		}
	}
}

const api: InternalWidgetAPI = {
	popup: null,

	openWidget,

	resizeWidget,

	ready() {
		ready = true;
		processHookQueue();
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

	openPopout(token = '') {
		closeWidget();
		if (!config.url) {
			throw new Error('Config.url is not set!');
		}
		const urlToken = token && `&token=${token}`;

		api.popup = window.open(
			`${config.url}${config.url.lastIndexOf('?') > -1 ? '&' : '?'}mode=popout${urlToken}`,
			'livechat-popout',
			`width=${WIDGET_OPEN_WIDTH}, height=${widgetHeight}, toolbars=no`,
		);
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

	setWidgetPosition,
};

const livechatWidgetAPI = {
	// initParams
	initialize,
	pageVisited,
	setCustomField,
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
	setGuestMetadata,
	clearAllCallbacks,
	setHiddenSystemMessages,
	transferChat,

	// callbacks
	onChatMaximized(fn: () => void) {
		registerCallback('chat-maximized', fn);
	},
	onChatMinimized(fn: () => void) {
		registerCallback('chat-minimized', fn);
	},
	onChatStarted(fn: () => void) {
		registerCallback('chat-started', fn);
	},
	onChatEnded(fn: () => void) {
		registerCallback('chat-ended', fn);
	},
	onPrechatFormSubmit(
		fn: () => {
			name: string;
			email: string;
			department?: string;
		},
	) {
		registerCallback('pre-chat-form-submit', fn);
	},
	onOfflineFormSubmit(
		fn: () => {
			name: string;
			email: string;
			department?: string;
			message: string;
		},
	) {
		registerCallback('offline-form-submit', fn);
	},
	onWidgetShown(fn: () => void) {
		registerCallback('show-widget', fn);
	},
	onWidgetHidden(fn: () => void) {
		registerCallback('hide-widget', fn);
	},
	onAssignAgent(
		fn: () => {
			name: string | undefined;
			username: string | undefined;
			status: UserStatus | undefined;
		},
	) {
		registerCallback('assign-agent', fn);
	},
	onAgentStatusChange(
		fn: () => {
			name: string | undefined;
			username: string | undefined;
			status: UserStatus | undefined;
		},
	) {
		registerCallback('agent-status-change', fn);
	},
	onQueuePositionChange(fn: () => LivechatRoomEvents<'queueData' | 'agentData'>) {
		registerCallback('queue-position-change', fn);
	},
	onServiceOffline(fn: () => void) {
		registerCallback('no-agent-online', fn);
	},
};

const currentPage: { href: string | null; title: string | null } = {
	href: null,
	title: null,
};

function onNewMessage(event: MessageEvent<LivechatMessageEventData<Omit<InternalWidgetAPI, 'popup'>>>) {
	if (event.source === event.target) {
		return;
	}

	if (!event.data || typeof event.data !== 'object') {
		return;
	}

	if (!event.data.src || event.data.src !== 'rocketchat') {
		return;
	}

	const { fn, args } = event.data;

	if (!api.hasOwnProperty(fn)) {
		return;
	}

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

// exports
window.RocketChat.livechat = livechatWidgetAPI;

// proccess queue
queue.forEach((c: () => void) => {
	c.call(window.RocketChat.livechat);
});
