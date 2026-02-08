import { Meteor } from './meteor.ts';
import { Retry } from './retry.ts';
import { Dependency } from './tracker.ts';

const forcedReconnectError = new Error('forced reconnect');

abstract class StreamClientCommon {
	currentStatus: { status: string; connected: boolean; retryCount: number; retryTime?: number; reason?: unknown };

	statusListeners: Dependency | null;

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

	forEachCallback(name: string, cb: (...args: any[]) => void) {
		if (!this.eventCallbacks[name]?.length) {
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

		this.statusListeners = new Dependency();

		this.statusChanged = () => {
			if (this.statusListeners) {
				this.statusListeners.changed();
			}
		};

		this._retry = new Retry();
		this.connectionTimer = null;
	}

	abstract _changeUrl(url: string): void;

	reconnect(options?: { url?: string; _force?: boolean }) {
		if (options?.url) {
			this._changeUrl(options.url);
		}

		if (this.currentStatus.connected) {
			if (options?._force || options?.url) {
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

	abstract _cleanup(maybeError?: unknown): void;

	_lostConnection(maybeError?: unknown) {
		this._cleanup(maybeError);
		this._retryLater(maybeError);
	}

	_online() {
		if (this.currentStatus.status !== 'offline') this.reconnect();
	}

	_retryLater(maybeError?: unknown) {
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

	abstract _launchConnection(): void;

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

		host = host.replace(/\*/g, () => `${Math.floor(Math.random() * 10)}`);

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

function toWebsocketUrl(url: string) {
	return translateUrl(url, 'ws', 'websocket');
}

class ClientStream extends StreamClientCommon {
	rawUrl: string;

	socket: WebSocket | null;

	override options: { retry?: boolean; _sockjsOptions?: Record<string, unknown>; connectTimeoutMs: number };

	heartbeatTimer: ReturnType<typeof setTimeout> | null;

	lastError: unknown;

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
			this.socket?.send(data);
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
			this.socket.removeEventListener('open', this._connected);
			this.socket.removeEventListener('message', this._heartbeat_received);
			this.socket.removeEventListener('close', this._lostConnection);
			this.socket.removeEventListener('error', this._lostConnection);
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

	_onError(error: unknown) {
		const { lastError } = this;

		this.lastError = error;

		if (lastError) return;

		console.error('stream error', error, new Date().toDateString());
	}

	_onMessage(data: MessageEvent) {
		this.lastError = null;
		this._heartbeat_received();

		if (this.currentStatus.connected) {
			this.forEachCallback('message', (callback) => {
				callback(data.data);
			});
		}
	}

	_onOpen() {
		this.lastError = null;
		this._connected();
	}

	_launchConnection() {
		this._cleanup();

		this.socket = new WebSocket(toWebsocketUrl(this.rawUrl));

		this.socket.addEventListener('open', this._onOpen.bind(this));
		this.socket.addEventListener('message', this._onMessage.bind(this));
		this.socket.addEventListener('close', this._lostConnection.bind(this));
		this.socket.addEventListener('error', this._onError.bind(this));

		if (this.connectionTimer) clearTimeout(this.connectionTimer);

		this.connectionTimer = setTimeout(() => {
			this._lostConnection(new Error('DDP connection timed out'));
		}, this.CONNECT_TIMEOUT);
	}
}

export { ClientStream };
