import { DDPCommon } from 'meteor/ddp-common';
import { Meteor } from 'meteor/meteor';
import { DDP } from './namespace.ts';
import type { Constructor } from './base-connection.ts';
import type { DocumentProcessorsInstance } from './document-processors.ts';

const { isEmpty } = DDPCommon;

// This mixin requires the methods provided by DocumentProcessorsMixin
export function MessageProcessorsMixin<TBase extends Constructor<DocumentProcessorsInstance>>(Base: TBase) {
  return class extends Base {
    public async _livedata_connected(msg: any): Promise<void> {
      if (this._version !== 'pre1' && this._heartbeatInterval !== 0) {
        this._heartbeat = new DDPCommon.Heartbeat({
          heartbeatInterval: this._heartbeatInterval,
          heartbeatTimeout: this._heartbeatTimeout,
          onTimeout: () => {
            this._lostConnection(new DDP.ConnectionError('DDP heartbeat timed out'));
          },
          sendPing: () => {
            this._send({ msg: 'ping' });
          }
        });
        this._heartbeat.start();
      }

      if (this._lastSessionId) this._resetStores = true;

      const reconnectedToPreviousSession = typeof msg.session === 'string' && this._lastSessionId === msg.session;
      if (typeof msg.session === 'string') this._lastSessionId = msg.session;

      if (reconnectedToPreviousSession) return;

      this._updatesForUnknownStores = Object.create(null);

      if (this._resetStores) {
        this._documentsWrittenByStub = Object.create(null);
        this._serverDocuments = Object.create(null);
      }

      this._afterUpdateCallbacks = [];
      this._subsBeingRevived = Object.create(null);

      Object.entries(this._subscriptions).forEach(([id, sub]: [string, any]) => {
        if (sub.ready) this._subsBeingRevived[id] = true;
      });

      this._methodsBlockingQuiescence = Object.create(null);
      if (this._resetStores) {
        Object.values(this._methodInvokers).forEach((invoker: any) => {
          if (invoker.gotResult()) {
            this._afterUpdateCallbacks.push((...args: any[]) => invoker.dataVisible(...args));
          } else if (invoker.sentMessage) {
            this._methodsBlockingQuiescence[invoker.methodId] = true;
          }
        });
      }

      this._messagesBufferedUntilQuiescence = [];

      if (!this._waitingForQuiescence()) {
        if (this._resetStores) {
          for (const store of Object.values(this._stores as Record<string, any>)) {
            await store.beginUpdate(0, true);
            await store.endUpdate();
          }
          this._resetStores = false;
        }
        this._runAfterUpdateCallbacks();
      }
    }

    public async _livedata_data(msg: any): Promise<void> {
      if (this._waitingForQuiescence()) {
        this._messagesBufferedUntilQuiescence.push(msg);

        if (msg.msg === 'nosub' && msg.id) delete this._subsBeingRevived[msg.id];
        if (msg.subs) msg.subs.forEach((subId: string) => delete this._subsBeingRevived[subId]);
        if (msg.methods) msg.methods.forEach((methodId: string) => delete this._methodsBlockingQuiescence[methodId]);

        if (this._waitingForQuiescence()) return;

        const bufferedMessages = this._messagesBufferedUntilQuiescence;
        for (const bufferedMessage of Object.values(bufferedMessages)) {
          await this._processOneDataMessage(bufferedMessage, this._bufferedWrites);
        }
        this._messagesBufferedUntilQuiescence = [];
      } else {
        await this._processOneDataMessage(msg, this._bufferedWrites);
      }

      const standardWrite = msg.msg === "added" || msg.msg === "changed" || msg.msg === "removed";

      if (this._bufferedWritesInterval === 0 || !standardWrite) {
        await this._flushBufferedWrites();
        return;
      }

      if (this._bufferedWritesFlushAt === null) {
        this._bufferedWritesFlushAt = new Date().valueOf() + this._bufferedWritesMaxAge;
      } else if (this._bufferedWritesFlushAt < new Date().valueOf()) {
        await this._flushBufferedWrites();
        return;
      }

      if (this._bufferedWritesFlushHandle) clearTimeout(this._bufferedWritesFlushHandle);
      this._bufferedWritesFlushHandle = setTimeout(() => {
        this._liveDataWritesPromise = this._flushBufferedWrites();
        if (this._liveDataWritesPromise instanceof Promise) {
          this._liveDataWritesPromise.finally(() => (this._liveDataWritesPromise = undefined));
        }
      }, this._bufferedWritesInterval);
    }

    protected async _processOneDataMessage(msg: any, updates: any): Promise<void> {
      switch (msg.msg) {
        // Here we rely on DocumentProcessorsMixin injecting these methods!
        case 'added': await this._process_added(msg, updates); break;
        case 'changed': this._process_changed(msg, updates); break;
        case 'removed': this._process_removed(msg, updates); break;
        case 'ready': this._process_ready(msg, updates); break;
        case 'updated': this._process_updated(msg, updates); break;
        case 'nosub': break;
        default: console.warn('discarding unknown livedata data message type', msg);
      }
    }

    public async _livedata_result(msg: any): Promise<void> {
      if (!isEmpty(this._bufferedWrites)) await this._flushBufferedWrites();

      if (isEmpty(this._outstandingMethodBlocks)) return;

      const currentMethodBlock = this._outstandingMethodBlocks[0].methods;
      const idx = currentMethodBlock.findIndex((method: any) => method.methodId === msg.id);
      const m = currentMethodBlock[idx];

      if (!m) return;

      currentMethodBlock.splice(idx, 1);

      if (Object.prototype.hasOwnProperty.call(msg, 'error') && msg.error) {
        m.receiveResult(new Meteor.Error(msg.error.error, msg.error.reason, msg.error.details));
      } else {
        m.receiveResult(undefined, msg.result);
      }
    }

    public async _livedata_nosub(msg: any): Promise<void> {
      await this._livedata_data(msg);

      if (!msg.id || !Object.prototype.hasOwnProperty.call(this._subscriptions, msg.id)) return;

      const errorCallback = this._subscriptions[msg.id].errorCallback;
      const stopCallback = this._subscriptions[msg.id].stopCallback;

      this._subscriptions[msg.id].remove();

      const meteorErrorFromMsg = (msgArg: any) => {
        return msgArg?.error ? new Meteor.Error(msgArg.error.error, msgArg.error.reason, msgArg.error.details) : undefined;
      };

      if (errorCallback && msg.error) errorCallback(meteorErrorFromMsg(msg));
      if (stopCallback) stopCallback(meteorErrorFromMsg(msg));
    }

    public _livedata_error(msg: any): void {
      console.error('Received error from server: ', msg.reason);
      if (msg.offendingMessage) console.error('For: ', msg.offendingMessage);
    }
  };
}

export type MessageProcessorsInstance = InstanceType<ReturnType<typeof MessageProcessorsMixin<Constructor<DocumentProcessorsInstance>>>>;