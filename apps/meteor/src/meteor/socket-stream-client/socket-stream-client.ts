import { Tracker } from 'meteor/tracker';
import { Retry } from 'meteor/retry';

// ==========================================
// URL Utilities
// ==========================================

function translateUrl(url: string, newSchemeBase: string, subPath: string): string {
    let schemeBase = newSchemeBase || 'http';

    // Resolve relative URLs using the modern browser location
    if (subPath !== "sockjs" && url.startsWith("/")) {
        url = (typeof window !== 'undefined' ? window.location.origin : '') + url;
    }

    const ddpUrlMatch = url.match(/^ddp(i?)\+sockjs:\/\//);
    const httpUrlMatch = url.match(/^http(s?):\/\//);
    let newScheme: string;

    if (ddpUrlMatch) {
        const urlAfterDDP = url.substring(ddpUrlMatch[0].length);
        newScheme = ddpUrlMatch[1] === 'i' ? schemeBase : `${schemeBase}s`;

        const slashPos = urlAfterDDP.indexOf('/');
        let host = slashPos === -1 ? urlAfterDDP : urlAfterDDP.substring(0, slashPos);
        const rest = slashPos === -1 ? '' : urlAfterDDP.substring(slashPos);

        // In the host (ONLY!), change '*' characters into random digits.
        host = host.replace(/\*/g, () => String(Math.floor(Math.random() * 10)));
        return `${newScheme}://${host}${rest}`;
    } else if (httpUrlMatch) {
        newScheme = !httpUrlMatch[1] ? schemeBase : `${schemeBase}s`;
        const urlAfterHttp = url.substring(httpUrlMatch[0].length);
        url = `${newScheme}://${urlAfterHttp}`;
    }

    // Prefix FQDNs but not relative URLs
    if (url.indexOf('://') === -1 && !url.startsWith('/')) {
        url = `${schemeBase}://${url}`;
    }

    // Handle absolute paths by prepending the site origin
    if (url.startsWith('/') && typeof window !== 'undefined') {
        url = window.location.origin + url;
    }

    if (url.endsWith('/')) {
        return url + subPath;
    }
    return `${url}/${subPath}`;
}

export function toSockjsUrl(url: string): string {
    return translateUrl(url, 'http', 'sockjs');
}

export function toWebsocketUrl(url: string): string {
    return translateUrl(url, 'ws', 'websocket');
}

// ==========================================
// Base Client Stream Logic
// ==========================================

export type StreamClientStatus = 'connecting' | 'connected' | 'failed' | 'waiting' | 'offline';

export type ConnectionStatus = {
    status: StreamClientStatus;
    connected: boolean;
    retryCount: number;
    retryTime?: number;
    reason?: string;
};

export type StreamClientOptions = {
    retry?: boolean;
    ConnectionError?: ErrorConstructor;
    connectTimeoutMs?: number;
    _sockjsOptions?: any;
    _dontPrintErrors?: boolean;
};

const forcedReconnectError = new Error("forced reconnect");

export abstract class StreamClientCommon {
    protected options: StreamClientOptions;
    protected ConnectionError: ErrorConstructor;
    protected CONNECT_TIMEOUT: number;
    protected eventCallbacks: Record<string, Function[]>;
    protected _forcedToDisconnect: boolean;
    protected currentStatus: ConnectionStatus;
    protected statusListeners?: Tracker.Dependency;
    protected _retry: Retry;
    protected connectionTimer: ReturnType<typeof setTimeout> | null;

    constructor(options?: StreamClientOptions) {
        this.options = {
            retry: true,
            ...(options || {}),
        };

        this.ConnectionError = this.options.ConnectionError || Error;
        this.CONNECT_TIMEOUT = this.options.connectTimeoutMs || 10000;
        this.eventCallbacks = Object.create(null);
        this._forcedToDisconnect = false;

        this.currentStatus = {
            status: 'connecting',
            connected: false,
            retryCount: 0
        };

        // Try to safely initialize Tracker dependency if available
        try {
            this.statusListeners = new Tracker.Dependency();
        } catch (e) {
            // Fallback if Tracker isn't injected in a specific test/env
        }

        this._retry = new Retry();
        this.connectionTimer = null;
    }

    public on(name: 'message' | 'reset' | 'disconnect', callback: Function): void {
        if (name !== 'message' && name !== 'reset' && name !== 'disconnect') {
            throw new Error(`unknown event type: ${name}`);
        }
        if (!this.eventCallbacks[name]) {
            this.eventCallbacks[name] = [];
        }
        this.eventCallbacks[name].push(callback);
    }

    protected forEachCallback(name: string, cb: (callback: Function) => void): void {
        if (!this.eventCallbacks[name] || !this.eventCallbacks[name].length) {
            return;
        }
        this.eventCallbacks[name].forEach(cb);
    }

    public statusChanged(): void {
        if (this.statusListeners) {
            this.statusListeners.changed();
        }
    }

    public reconnect(options?: { url?: string; _sockjsOptions?: any; _force?: boolean }): void {
        const opts = options || Object.create(null);

        if (opts.url) {
            this._changeUrl(opts.url);
        }

        if (opts._sockjsOptions) {
            this.options._sockjsOptions = opts._sockjsOptions;
        }

        if (this.currentStatus.connected) {
            if (opts._force || opts.url) {
                this._lostConnection(forcedReconnectError);
            }
            return;
        }

        if (this.currentStatus.status === 'connecting') {
            this._lostConnection(); // Pretend clean close
        }

        this._retry.clear();
        this.currentStatus.retryCount -= 1;
        this._retryNow();
    }

    public disconnect(options?: { _permanent?: boolean; _error?: string }): void {
        const opts = options || Object.create(null);

        if (this._forcedToDisconnect) return;

        if (opts._permanent) {
            this._forcedToDisconnect = true;
        }

        this._cleanup();
        this._retry.clear();

        this.currentStatus = {
            status: opts._permanent ? 'failed' : 'offline',
            connected: false,
            retryCount: 0
        };

        if (opts._permanent && opts._error) {
            this.currentStatus.reason = opts._error;
        }

        this.statusChanged();
    }

    protected _lostConnection(maybeError?: Error): void {
        this._cleanup(maybeError);
        this._retryLater(maybeError);
    }

    protected _online(): void {
        if (this.currentStatus.status !== 'offline') {
            this.reconnect();
        }
    }

    protected _retryLater(maybeError?: Error): void {
        let timeout = 0;
        if (this.options.retry || maybeError === forcedReconnectError) {
            timeout = this._retry.retryLater(
                this.currentStatus.retryCount,
                this._retryNow.bind(this)
            );
            this.currentStatus.status = 'waiting';
            this.currentStatus.retryTime = new Date().getTime() + timeout;
        } else {
            this.currentStatus.status = 'failed';
            delete this.currentStatus.retryTime;
        }

        this.currentStatus.connected = false;
        this.statusChanged();
    }

    protected _retryNow(): void {
        if (this._forcedToDisconnect) return;

        this.currentStatus.retryCount += 1;
        this.currentStatus.status = 'connecting';
        this.currentStatus.connected = false;
        delete this.currentStatus.retryTime;
        this.statusChanged();

        this._launchConnection();
    }

    public status(): ConnectionStatus {
        if (this.statusListeners) {
            this.statusListeners.depend();
        }
        return this.currentStatus;
    }

    // To be implemented by child classes
    protected abstract _changeUrl(url: string): void;
    protected abstract _cleanup(maybeError?: Error): void;
    protected abstract _launchConnection(): void;
}

// ==========================================
// Browser/Client Stream Logic
// ==========================================

export class ClientStream extends StreamClientCommon {
    public HEARTBEAT_TIMEOUT = 100 * 1000;
    public rawUrl: string;
    public socket: WebSocket | null = null;
    public lastError: any = null;
    public heartbeatTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(url: string, options?: StreamClientOptions) {
        super(options);
        this.rawUrl = url;

        if (typeof window !== 'undefined') {
            window.addEventListener('online', this._online.bind(this), false);
        }

        this._launchConnection();
    }

    public send(data: string): void {
        if (this.currentStatus.connected && this.socket) {
            this.socket.send(data);
        }
    }

    protected override _changeUrl(url: string): void {
        this.rawUrl = url;
    }

    protected _connected(): void {
        if (this.connectionTimer) {
            clearTimeout(this.connectionTimer);
            this.connectionTimer = null;
        }

        if (this.currentStatus.connected) return;

        this.currentStatus.status = 'connected';
        this.currentStatus.connected = true;
        this.currentStatus.retryCount = 0;
        this.statusChanged();

        this.forEachCallback('reset', (callback: Function) => {
            callback();
        });
    }

    protected override _cleanup(maybeError?: Error): void {
        this._clearConnectionAndHeartbeatTimers();
        if (this.socket) {
            this.socket.onmessage = () => { };
            this.socket.onclose = () => { };
            this.socket.onerror = () => { };
            (this.socket as any).onheartbeat = () => { };
            this.socket.close();
            this.socket = null;
        }

        this.forEachCallback('disconnect', (callback: Function) => {
            callback(maybeError);
        });
    }

    private _clearConnectionAndHeartbeatTimers(): void {
        if (this.connectionTimer) {
            clearTimeout(this.connectionTimer);
            this.connectionTimer = null;
        }
        if (this.heartbeatTimer) {
            clearTimeout(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    private _heartbeat_timeout(): void {
        console.warn('Connection timeout. No sockjs heartbeat received.');
        this._lostConnection(new this.ConnectionError("Heartbeat timed out"));
    }

    private _heartbeat_received(): void {
        if (this._forcedToDisconnect) return;
        if (this.heartbeatTimer) clearTimeout(this.heartbeatTimer);

        this.heartbeatTimer = setTimeout(
            this._heartbeat_timeout.bind(this),
            this.HEARTBEAT_TIMEOUT
        );
    }

    protected override _launchConnection(): void {
        this._cleanup();

        // Safely check runtime configs for disabled features

        this.socket = new WebSocket(toWebsocketUrl(this.rawUrl));

        this.socket.onopen = () => {
            this.lastError = null;
            this._connected();
        };

        this.socket.onmessage = (data: any) => {
            this.lastError = null;
            this._heartbeat_received();
            if (this.currentStatus.connected) {
                this.forEachCallback('message', (callback: Function) => {
                    callback(data.data);
                });
            }
        };

        this.socket.onclose = () => {
            this._lostConnection();
        };

        this.socket.onerror = (error: any) => {
            const lastError = this.lastError;
            this.lastError = error;
            if (lastError) return;

            if (!this.options._dontPrintErrors) {
                console.error('stream error', error, new Date().toDateString());
            }
        };

        (this.socket as any).onheartbeat = () => {
            this.lastError = null;
            this._heartbeat_received();
        };

        if (this.connectionTimer) clearTimeout(this.connectionTimer);
        this.connectionTimer = setTimeout(() => {
            this._lostConnection(
                new this.ConnectionError("DDP connection timed out")
            );
        }, this.CONNECT_TIMEOUT);
    }
}