import { Meteor } from './meteor.ts';
import { Retry } from './retry.ts';
import { Dependency } from './tracker.ts';

const forcedReconnectError = new Error('forced reconnect');

type ClientStreamOptions = {
	retry?: boolean;
	_sockjsOptions?: Record<string, unknown>;
	connectTimeoutMs?: number;
};

type StreamStatus = {
	status: 'connected' | 'connecting' | 'failed' | 'offline' | 'waiting';
	connected: boolean;
	retryCount: number;
	retryTime?: number;
	reason?: unknown;
};

class ClientStream {
	// Properties merged from StreamClientCommon
	currentStatus: StreamStatus;

	statusListeners: Dependency;

	CONNECT_TIMEOUT: number;

	_retry: Retry;

	connectionTimer: ReturnType<typeof setTimeout> | null;

	_forcedToDisconnect: boolean;

	eventCallbacks: Record<string, Array<(...args: any[]) => void>>;

	options: ClientStreamOptions;

	// Properties from ClientStream
	rawUrl: string;

	socket: WebSocket | null;

	heartbeatTimer: ReturnType<typeof setTimeout> | null;

	lastError: unknown;

	HEARTBEAT_TIMEOUT: number;

	constructor(url: string, options: ClientStreamOptions = {}) {
		// Initialization logic merged from _initCommon
		this.options = { retry: true, ...options };
		this.CONNECT_TIMEOUT = this.options.connectTimeoutMs || 10000;
		this.HEARTBEAT_TIMEOUT = 100 * 1000;

		this.rawUrl = url;
		this.socket = null;
		this.lastError = null;
		this.connectionTimer = null;
		this.heartbeatTimer = null;
		this._forcedToDisconnect = false;

		this.eventCallbacks = Object.create(null);
		this.currentStatus = { status: 'connecting', connected: false, retryCount: 0 };
		this.statusListeners = new Dependency();
		this._retry = new Retry();

		// Bind event handlers once to ensure add/removeEventListener works correctly
		this._onOpen = this._onOpen.bind(this);
		this._onMessage = this._onMessage.bind(this);
		this._onError = this._onError.bind(this);
		this._lostConnection = this._lostConnection.bind(this);
		this._online = this._online.bind(this);

		window.addEventListener('online', this._online, false);
		this._launchConnection();
	}

	// -------------------------------------------------------------------------
	// Public API
	// -------------------------------------------------------------------------

	on(name: string, callback: (...args: any[]) => void) {
		if (name !== 'message' && name !== 'reset' && name !== 'disconnect') {
			throw new Error(`unknown event type: ${name}`);
		}
		if (!this.eventCallbacks[name]) this.eventCallbacks[name] = [];
		this.eventCallbacks[name].push(callback);
	}

	status() {
		if (this.statusListeners) {
			this.statusListeners.depend();
		}
		return this.currentStatus;
	}

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

	disconnect(options: { _permanent?: boolean; _error?: unknown } = {}) {
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

		if (options._permanent && options._error) {
			this.currentStatus.reason = options._error;
		}

		this._statusChanged();
	}

	send(data: string | ArrayBufferLike | Blob | ArrayBufferView<ArrayBufferLike>) {
		if (this.currentStatus.connected) {
			this.socket?.send(data);
		}
	}

	// -------------------------------------------------------------------------
	// Internal Logic
	// -------------------------------------------------------------------------

	protected forEachCallback(name: string, cb: (...args: any[]) => void) {
		if (!this.eventCallbacks[name]?.length) {
			return;
		}
		this.eventCallbacks[name].forEach(cb);
	}

	private _statusChanged() {
		if (this.statusListeners) {
			this.statusListeners.changed();
		}
	}

	private _changeUrl(url: string) {
		this.rawUrl = url;
	}

	private _launchConnection() {
		this._cleanup();

		try {
			this.socket = new WebSocket(toWebsocketUrl(this.rawUrl));

			this.socket.addEventListener('open', this._onOpen);
			this.socket.addEventListener('message', this._onMessage);
			this.socket.addEventListener('close', this._lostConnection);
			this.socket.addEventListener('error', this._onError);

			if (this.connectionTimer) clearTimeout(this.connectionTimer);

			this.connectionTimer = setTimeout(() => {
				this._lostConnection(new Error('DDP connection timed out'));
			}, this.CONNECT_TIMEOUT);
		} catch (e) {
			// Handle malformed URLs or other immediate instantiation errors
			this._onError(e);
		}
	}

	private _connected() {
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
		this._statusChanged();

		this.forEachCallback('reset', (callback: () => void) => {
			callback();
		});
	}

	private _cleanup(maybeError?: unknown) {
		this._clearConnectionAndHeartbeatTimers();

		if (this.socket) {
			this.socket.removeEventListener('open', this._onOpen);
			this.socket.removeEventListener('message', this._onMessage);
			this.socket.removeEventListener('close', this._lostConnection);
			this.socket.removeEventListener('error', this._onError);
			this.socket.close();
			this.socket = null;
		}

		this.forEachCallback('disconnect', (callback: (arg0: any) => void) => {
			callback(maybeError);
		});
	}

	private _lostConnection(maybeError?: unknown) {
		// In the original code, `_lostConnection` was bound to the 'close' event.
		// If it's a CloseEvent, we don't treat it as an error object for the callback.
		const errorToPass = maybeError instanceof Event ? undefined : maybeError;

		this._cleanup(errorToPass);
		this._retryLater(errorToPass);
	}

	private _online() {
		if (this.currentStatus.status !== 'offline') this.reconnect();
	}

	private _retryLater(maybeError?: unknown) {
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
		this._statusChanged();
	}

	private _retryNow() {
		if (this._forcedToDisconnect) return;

		this.currentStatus.retryCount += 1;
		this.currentStatus.status = 'connecting';
		this.currentStatus.connected = false;
		delete this.currentStatus.retryTime;
		this._statusChanged();
		this._launchConnection();
	}

	private _clearConnectionAndHeartbeatTimers() {
		if (this.connectionTimer) {
			clearTimeout(this.connectionTimer);
			this.connectionTimer = null;
		}
		if (this.heartbeatTimer) {
			clearTimeout(this.heartbeatTimer);
			this.heartbeatTimer = null;
		}
	}

	private _heartbeat_timeout() {
		console.log('Connection timeout. No sockjs heartbeat received.');
		this._lostConnection(new Error('Heartbeat timed out'));
	}

	private _heartbeat_received() {
		if (this._forcedToDisconnect) return;
		if (this.heartbeatTimer) clearTimeout(this.heartbeatTimer);

		this.heartbeatTimer = setTimeout(this._heartbeat_timeout.bind(this), this.HEARTBEAT_TIMEOUT);
	}

	// -------------------------------------------------------------------------
	// Event Handlers
	// -------------------------------------------------------------------------

	private _onOpen() {
		this.lastError = null;
		this._connected();
	}

	private _onMessage(event: MessageEvent) {
		this.lastError = null;
		this._heartbeat_received();

		if (this.currentStatus.connected) {
			this.forEachCallback('message', (callback) => {
				callback(event.data);
			});
		}
	}

	private _onError(error: unknown) {
		const { lastError } = this;
		this.lastError = error;
		if (lastError) return;
		console.error('stream error', error, new Date().toDateString());
	}
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

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

export { ClientStream };
