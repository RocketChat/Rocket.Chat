import { StreamClientCommon, type StreamClientOptions } from "./common.ts";
import { toWebsocketUrl } from "./urls.ts";

export class ClientStream extends StreamClientCommon {
  protected HEARTBEAT_TIMEOUT: number;
  protected rawUrl: string;
  protected socket: WebSocket | null;
  protected lastError: Event | Error | null;
  protected heartbeatTimer: ReturnType<typeof setTimeout> | null;
  protected _neverQueued: boolean = true;

  constructor(url: string, options?: StreamClientOptions) {
    super(options);

    this.HEARTBEAT_TIMEOUT = 100 * 1000;
    this.rawUrl = url;
    this.socket = null;
    this.lastError = null;
    this.heartbeatTimer = null;

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

  protected _changeUrl(url: string): void {
    this.rawUrl = url;
  }

  protected _connected(): void {
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

    this.forEachCallback('reset', callback => callback());
  }

  protected _cleanup(maybeError?: Error): void {
    this._clearConnectionAndHeartbeatTimers();
    if (this.socket) {
      this.socket.onmessage = null;
      this.socket.onclose = null;
      this.socket.onerror = null;
      this.socket.close();
      this.socket = null;
    }

    this.forEachCallback('disconnect', callback => callback(maybeError));
  }

  protected _clearConnectionAndHeartbeatTimers(): void {
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  protected _heartbeat_timeout(): void {
    console.debug('Connection timeout. No heartbeat received.');
    this._lostConnection(new this.ConnectionError("Heartbeat timed out"));
  }

  protected _heartbeat_received(): void {
    if (this._forcedToDisconnect) return;
    if (this.heartbeatTimer) clearTimeout(this.heartbeatTimer);
    this.heartbeatTimer = setTimeout(
      this._heartbeat_timeout.bind(this),
      this.HEARTBEAT_TIMEOUT
    );
  }

  protected _launchConnection(): void {
    this._cleanup();

    this.socket = new WebSocket(toWebsocketUrl(this.rawUrl));

    this.socket.onopen = () => {
      this.lastError = null;
      this._connected();
    };

    this.socket.onmessage = (data: MessageEvent) => {
      this.lastError = null;
      this._heartbeat_received();
      if (this.currentStatus.connected) {
        this.forEachCallback('message', callback => callback(data.data));
      }
    };

    this.socket.onclose = () => {
      this._lostConnection();
    };

    this.socket.onerror = (error: Event) => {
      const { lastError } = this;
      this.lastError = error;
      if (lastError) return;
      
      if (!this.options._dontPrintErrors) {
        console.error('stream error', error, new Date().toDateString());
      }
    };

    if (this.connectionTimer) clearTimeout(this.connectionTimer);
    this.connectionTimer = setTimeout(() => {
      this._lostConnection(new this.ConnectionError("DDP connection timed out"));
    }, this.CONNECT_TIMEOUT);
  }
}