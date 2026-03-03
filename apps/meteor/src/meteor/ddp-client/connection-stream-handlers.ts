import { DDPCommon } from 'meteor/ddp-common';
import type { Constructor } from './base-connection.ts';
import type { MessageProcessorsInstance } from './message-processors.ts';

export function StreamHandlersMixin<TBase extends Constructor<MessageProcessorsInstance>>(Base: TBase) {
  return class extends Base {
    public _streamHandlers: {
      onMessage: (raw_msg: string) => Promise<void>;
      onReset: () => void;
    };

    constructor(...args: any[]) {
      super(...args);

      // Restore the legacy API surface for overrides like ddpOverREST
      this._streamHandlers = {
        onMessage: (raw_msg: string) => this.onMessage(raw_msg),
        onReset: () => this.onReset(),
      };

      // Re-attach the stream event listeners that were dropped during the mixin refactor
      if (this._stream) {
        this._stream.on('message', (msg: string) => this._streamHandlers.onMessage(msg));
        this._stream.on('reset', () => this._streamHandlers.onReset());
        this._stream.on('disconnect', () => {
          if (this._heartbeat) {
            this._heartbeat.stop();
            this._heartbeat = null;
          }
        });
      }
    }

    public async onMessage(raw_msg: string): Promise<void> {
      let msg: any;
      try {
        msg = DDPCommon.parseDDP(raw_msg);
      } catch (e) {
        console.error('Exception while parsing DDP', e);
        return;
      }

      if (this._heartbeat) this._heartbeat.messageReceived();

      if (msg === null || !msg.msg) {
        if (!msg || !msg.testMessageOnConnect) {
          if (Object.keys(msg || {}).length === 1 && msg.server_id) return;
          console.warn('discarding invalid livedata message', msg);
        }
        return;
      }

      if (msg.msg === 'connected') {
        this._version = this._versionSuggestion;
      }

      await this._routeMessage(msg);
    }

    protected async _routeMessage(msg: any): Promise<void> {
      switch (msg.msg) {
        // Calling methods guaranteed by MessageProcessorsMixin
        case 'connected':
          await this._livedata_connected(msg);
          this.options.onConnected?.();
          break;
        case 'failed':
          await this._handleFailedMessage(msg);
          break;
        case 'ping':
          if (this.options.respondToPings) this._send({ msg: 'pong', id: msg.id });
          break;
        case 'pong': break;
        case 'added':
        case 'changed':
        case 'removed':
        case 'ready':
        case 'updated':
          await this._livedata_data(msg);
          break;
        case 'nosub':
          await this._livedata_nosub(msg);
          break;
        case 'result':
          await this._livedata_result(msg);
          break;
        case 'error':
          this._livedata_error(msg);
          break;
        default:
          console.warn('discarding unknown livedata message type', msg);
      }
    }

    protected _handleFailedMessage(msg: any): void {
      if (this._supportedDDPVersions.includes(msg.version)) {
        this._versionSuggestion = msg.version;
        this._stream.reconnect({ _force: true });
      } else {
        const description = `DDP version negotiation failed; server requested version ${msg.version}`;
        this._stream.disconnect({ _permanent: true, _error: description });
        this.options.onDDPVersionNegotiationFailure?.(description);
      }
    }

    public onReset(): void {
      this._send(this._buildConnectMessage());
      this._handleOutstandingMethodsOnReset();
      this._callOnReconnectAndSendAppropriateOutstandingMethods();
      this._resendSubscriptions();
    }

    protected _buildConnectMessage(): any {
      const msg: any = { msg: 'connect' };
      if (this._lastSessionId) msg.session = this._lastSessionId;
      msg.version = this._versionSuggestion || this._supportedDDPVersions[0];
      this._versionSuggestion = msg.version;
      msg.support = this._supportedDDPVersions;
      return msg;
    }

    protected _handleOutstandingMethodsOnReset(): void {
      const blocks = this._outstandingMethodBlocks;
      if (blocks.length === 0) return;

      blocks[0].methods = blocks[0].methods.filter((methodInvoker: any) => {
        if (methodInvoker.sentMessage && methodInvoker.noRetry) {
          methodInvoker.receiveResult(
            new Error(
              'invocation-failed: Method invocation might have failed due to dropped connection. ' +
              'Failing because `noRetry` option was passed to apply.'
            )
          );
        }
        return !(methodInvoker.sentMessage && methodInvoker.noRetry);
      });

      if (blocks.length > 0 && blocks[0].methods.length === 0) blocks.shift();

      Object.values(this._methodInvokers).forEach((invoker: any) => {
        invoker.sentMessage = false;
      });
    }

    protected _resendSubscriptions(): void {
      Object.entries(this._subscriptions).forEach(([id, sub]: [string, any]) => {
        this._sendQueued({ msg: 'sub', id, name: sub.name, params: sub.params });
      });
    }
  };
}
