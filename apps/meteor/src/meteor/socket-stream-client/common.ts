import { Retry } from 'meteor/retry';
import { Tracker } from 'meteor/tracker';

const forcedReconnectError = new Error("forced reconnect");

export type StreamStatus = {
  status: 'connecting' | 'connected' | 'offline' | 'waiting' | 'failed';
  connected: boolean;
  retryCount: number;
  retryTime?: number;
  reason?: Error | string;
  fake?: boolean;
};

export type StreamClientOptions = {
  retry?: boolean | undefined;
  connectTimeoutMs?: number | undefined;
  ConnectionError?: new (message: string) => Error;
  _dontPrintErrors?: boolean | undefined;
  headers?: Record<string, string> | undefined;
  _sockJsOptions?: Record<string, any>;
};

export type ReconnectOptions = {
  url?: string;
  _force?: boolean;
};

export type DisconnectOptions = {
  _permanent?: boolean;
  _error?: Error | string;
};

export abstract class StreamClientCommon {
  protected options: StreamClientOptions;
  protected ConnectionError: new (message: string) => Error;

  protected CONNECT_TIMEOUT: number;
  protected eventCallbacks: Record<string, Array<(...args: any[]) => void>>;
  protected _forcedToDisconnect: boolean;
  protected currentStatus: StreamStatus;
  protected statusListeners?: Tracker.Dependency;
  protected statusChanged: () => void;
  protected _retry: Retry;
  protected connectionTimer: ReturnType<typeof setTimeout> | null;

  constructor(options?: StreamClientOptions) {
    this.options = {
      retry: true,
      ...(options || null),
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

    this.statusListeners = new Tracker.Dependency();

    this.statusChanged = () => {
      if (this.statusListeners) {
        this.statusListeners.changed();
      }
    };

    this._retry = new Retry();
    this.connectionTimer = null;
  }

  public on(name: 'message' | 'reset' | 'disconnect', callback: (...args: any[]) => void): void {
    if (name !== 'message' && name !== 'reset' && name !== 'disconnect') {
      throw new Error(`unknown event type: ${name}`);
    }

    if (!this.eventCallbacks[name]) {
      this.eventCallbacks[name] = [];
    }
    this.eventCallbacks[name].push(callback);
  }

  public forEachCallback(name: string, cb: (callback: (...args: any[]) => void) => void): void {
    if (!this.eventCallbacks[name] || !this.eventCallbacks[name].length) {
      return;
    }
    this.eventCallbacks[name].forEach(cb);
  }

  public reconnect(options: ReconnectOptions = Object.create(null)): void {
    if (options.url) {
      this._changeUrl(options.url);
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

  public disconnect(options: DisconnectOptions = Object.create(null)): void {
    if (this._forcedToDisconnect) return;

    if (options._permanent) {
      this._forcedToDisconnect = true;
    }

    this._cleanup();
    this._retry.clear();

    this.currentStatus = {
      status: options._permanent ? 'failed' : 'offline',
      connected: false,
      retryCount: 0
    };

    if (options._permanent && options._error) {
      this.currentStatus.reason = options._error;
    }

    this.statusChanged();
  }

  public _lostConnection(maybeError?: Error): void {
    this._cleanup(maybeError);
    this._retryLater(maybeError);
  }

  public _online(): void {
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

  public status(): StreamStatus {
    if (this.statusListeners) {
      this.statusListeners.depend();
    }
    return this.currentStatus;
  }

  protected abstract _changeUrl(url: string): void;
  protected abstract _cleanup(maybeError?: Error): void;
  protected abstract _launchConnection(): void;
}