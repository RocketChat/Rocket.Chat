import { Meteor } from 'meteor/meteor';

import { Package } from './package-registry.ts';
import { Retry } from './retry.ts';
import type * as Tracker from './tracker/index.ts';

const forcedReconnectError = new Error('forced reconnect');

class StreamClientCommon {
	currentStatus: { status: string; connected: boolean; retryCount: number; retryTime?: number; reason?: unknown };

	statusListeners: Tracker.Dependency | null;

	CONNECT_TIMEOUT: number;

	statusChanged: () => void;

	_retry: Retry;

	connectionTimer: ReturnType<typeof setTimeout> | null;

	_forcedToDisconnect: boolean;

	eventCallbacks: Record<string, Array<(...args: any[]) => void>>;

	options: { retry?: boolean; _sockjsOptions?: Record<string, unknown>; connectTimeoutMs?: number };

	constructor(options: { retry?: boolean; _sockjsOptions?: Record<string, unknown>; connectTimeoutMs?: number }) {
		this.options = { retry: true, ...options };
	}

	on(name: string, callback: (...args: any[]) => void) {
		if (name !== 'message' && name !== 'reset' && name !== 'disconnect') throw new Error(`unknown event type: ${name}`);
		if (!this.eventCallbacks[name]) this.eventCallbacks[name] = [];

		this.eventCallbacks[name].push(callback);
	}

	forEachCallback(
		name: string,
		cb: {
			(callback: any): void;
			(callback: any): void;
			(callback: any): void;
			(value: (...args: any[]) => void, index: number, array: ((...args: any[]) => void)[]): void;
		},
	) {
		if (!this.eventCallbacks[name] || !this.eventCallbacks[name].length) {
			return;
		}

		this.eventCallbacks[name].forEach(cb);
	}

	_initCommon(options: { connectTimeoutMs: number }) {
		options = options || Object.create(null);
		this.CONNECT_TIMEOUT = options.connectTimeoutMs || 10000;
		this.eventCallbacks = Object.create(null);
		this._forcedToDisconnect = false;
		this.currentStatus = { status: 'connecting', connected: false, retryCount: 0 };

		if (Package.tracker) {
			this.statusListeners = new Package.tracker.Tracker.Dependency();
		}

		this.statusChanged = () => {
			if (this.statusListeners) {
				this.statusListeners.changed();
			}
		};

		this._retry = new Retry();
		this.connectionTimer = null;
	}

	reconnect(options: { url: any; _sockjsOptions: Record<string, unknown> | undefined; _force: any } | undefined) {
		options = options || Object.create(null);

		if (options?.url) {
			this._changeUrl(options.url);
		}

		if (options._sockjsOptions) {
			this.options._sockjsOptions = options._sockjsOptions;
		}

		if (this.currentStatus.connected) {
			if (options._force || options.url) {
				this._lostConnection(forcedReconnectError);
			}

			return;
		}

		if (this.currentStatus.status === 'connecting') {
			this._lostConnection();
		}

		this._retry.clear();
		this.currentStatus.retryCount -= 1;
		this._retryNow();
	}

	disconnect(options: { _permanent: any; _error: unknown }) {
		options = options || Object.create(null);

		if (this._forcedToDisconnect) return;

		if (options._permanent) {
			this._forcedToDisconnect = true;
		}

		this._cleanup();
		this._retry.clear();

		this.currentStatus = {
			status: options._permanent ? 'failed' : 'offline',
			connected: false,
			retryCount: 0,
		};

		if (options._permanent && options._error) this.currentStatus.reason = options._error;

		this.statusChanged();
	}

	_lostConnection(maybeError: Error | undefined) {
		this._cleanup(maybeError);
		this._retryLater(maybeError);
	}

	_online() {
		if (this.currentStatus.status != 'offline') this.reconnect();
	}

	_retryLater(maybeError: Error) {
		let timeout = 0;

		if (this.options.retry || maybeError === forcedReconnectError) {
			timeout = this._retry.retryLater(this.currentStatus.retryCount, this._retryNow.bind(this));
			this.currentStatus.status = 'waiting';
			this.currentStatus.retryTime = new Date().getTime() + timeout;
		} else {
			this.currentStatus.status = 'failed';
			delete this.currentStatus.retryTime;
		}

		this.currentStatus.connected = false;
		this.statusChanged();
	}

	_retryNow() {
		if (this._forcedToDisconnect) return;

		this.currentStatus.retryCount += 1;
		this.currentStatus.status = 'connecting';
		this.currentStatus.connected = false;
		delete this.currentStatus.retryTime;
		this.statusChanged();
		this._launchConnection();
	}

	status() {
		if (this.statusListeners) {
			this.statusListeners.depend();
		}

		return this.currentStatus;
	}
}

function translateUrl(url: string, newSchemeBase: string, subPath: string) {
	if (!newSchemeBase) {
		newSchemeBase = 'http';
	}

	if (subPath !== 'sockjs' && url.startsWith('/')) {
		url = Meteor.absoluteUrl(url.substr(1));
	}

	const ddpUrlMatch = url.match(/^ddp(i?)\+sockjs:\/\//);
	const httpUrlMatch = url.match(/^http(s?):\/\//);
	let newScheme;

	if (ddpUrlMatch) {
		const urlAfterDDP = url.substr(ddpUrlMatch[0].length);

		newScheme = ddpUrlMatch[1] === 'i' ? newSchemeBase : `${newSchemeBase}s`;

		const slashPos = urlAfterDDP.indexOf('/');
		let host = slashPos === -1 ? urlAfterDDP : urlAfterDDP.substr(0, slashPos);
		const rest = slashPos === -1 ? '' : urlAfterDDP.substr(slashPos);

		host = host.replace(/\*/g, () => Math.floor(Math.random() * 10));

		return `${newScheme}://${host}${rest}`;
	}
	if (httpUrlMatch) {
		newScheme = !httpUrlMatch[1] ? newSchemeBase : `${newSchemeBase}s`;

		const urlAfterHttp = url.substr(httpUrlMatch[0].length);

		url = `${newScheme}://${urlAfterHttp}`;
	}

	if (url.indexOf('://') === -1 && !url.startsWith('/')) {
		url = `${newSchemeBase}://${url}`;
	}

	url = Meteor._relativeToSiteRootUrl(url);

	if (url.endsWith('/')) return url + subPath;
	return `${url}/${subPath}`;
}

function toSockjsUrl(url: string) {
	return translateUrl(url, 'http', 'sockjs');
}

function toWebsocketUrl(url: string) {
	return translateUrl(url, 'ws', 'websocket');
}

class ClientStream extends StreamClientCommon {
	rawUrl: string;

	socket: WebSocket | null;

	override options: { retry?: boolean; _sockjsOptions?: Record<string, unknown>; connectTimeoutMs: number };

	heartbeatTimer: ReturnType<typeof setTimeout> | null;

	lastError: Error | null;

	HEARTBEAT_TIMEOUT: number;

	constructor(url: string, options: any) {
		super(options);
		this._initCommon(this.options);
		this.HEARTBEAT_TIMEOUT = 100 * 1000;
		this.rawUrl = url;
		this.socket = null;
		this.lastError = null;
		this.heartbeatTimer = null;
		window.addEventListener('online', this._online.bind(this), false);
		this._launchConnection();
	}

	send(data: string | ArrayBufferLike | Blob | ArrayBufferView<ArrayBufferLike>) {
		if (this.currentStatus.connected) {
			this.socket.send(data);
		}
	}

	_changeUrl(url: string) {
		this.rawUrl = url;
	}

	_connected() {
		if (this.connectionTimer) {
			clearTimeout(this.connectionTimer);
			this.connectionTimer = null;
		}

		if (this.currentStatus.connected) {
			return;
		}

		this.currentStatus.status = 'connected';
		this.currentStatus.connected = true;
		this.currentStatus.retryCount = 0;
		this.statusChanged();

		this.forEachCallback('reset', (callback: () => void) => {
			callback();
		});
	}

	_cleanup(maybeError?: undefined) {
		this._clearConnectionAndHeartbeatTimers();

		if (this.socket) {
			this.socket.onheartbeat = () => {};
			this.socket.onerror = () => {};
			this.socket.onclose = () => {};
			this.socket.onmessage = () => {};
			this.socket.close();
			this.socket = null;
		}

		this.forEachCallback('disconnect', (callback: (arg0: any) => void) => {
			callback(maybeError);
		});
	}

	_clearConnectionAndHeartbeatTimers() {
		if (this.connectionTimer) {
			clearTimeout(this.connectionTimer);
			this.connectionTimer = null;
		}

		if (this.heartbeatTimer) {
			clearTimeout(this.heartbeatTimer);
			this.heartbeatTimer = null;
		}
	}

	_heartbeat_timeout() {
		console.log('Connection timeout. No sockjs heartbeat received.');
		this._lostConnection(new Error('Heartbeat timed out'));
	}

	_heartbeat_received() {
		if (this._forcedToDisconnect) return;
		if (this.heartbeatTimer) clearTimeout(this.heartbeatTimer);

		this.heartbeatTimer = setTimeout(this._heartbeat_timeout.bind(this), this.HEARTBEAT_TIMEOUT);
	}

	_sockjsProtocolsWhitelist() {
		let protocolsWhitelist = ['xdr-polling', 'xhr-polling', 'iframe-xhr-polling', 'jsonp-polling'];

		const noWebsockets = navigator && /iPhone|iPad|iPod/.test(navigator.userAgent) && /OS 4_|OS 5_/.test(navigator.userAgent);

		if (!noWebsockets) protocolsWhitelist = ['websocket'].concat(protocolsWhitelist);

		return protocolsWhitelist;
	}

	_launchConnection() {
		this._cleanup();

		this.socket = new WebSocket(toWebsocketUrl(this.rawUrl));

		this.socket.onopen = (data) => {
			this.lastError = null;
			this._connected();
		};

		this.socket.onmessage = (data) => {
			this.lastError = null;
			this._heartbeat_received();

			if (this.currentStatus.connected) {
				this.forEachCallback('message', (callback: (arg0: any) => void) => {
					callback(data.data);
				});
			}
		};

		this.socket.onclose = () => {
			this._lostConnection();
		};

		this.socket.onerror = (error) => {
			const { lastError } = this;

			this.lastError = error;

			if (lastError) return;

			console.error('stream error', error, new Date().toDateString());
		};

		this.socket.onheartbeat = () => {
			this.lastError = null;
			this._heartbeat_received();
		};

		if (this.connectionTimer) clearTimeout(this.connectionTimer);

		this.connectionTimer = setTimeout(() => {
			this._lostConnection(new Error('DDP connection timed out'));
		}, this.CONNECT_TIMEOUT);
	}
}

export { ClientStream };
