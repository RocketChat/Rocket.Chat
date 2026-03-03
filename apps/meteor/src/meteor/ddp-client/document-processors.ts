import { MongoID } from 'meteor/mongo-id';
import { DiffSequence } from 'meteor/diff-sequence';
import type { Constructor, BaseConnection } from './base-connection.ts';

export function DocumentProcessorsMixin<TBase extends Constructor<BaseConnection>>(Base: TBase) {
  return class extends Base {
    public async _process_added(msg: { id: string; collection: string; fields?: Record<string, any> }, updates: Record<string, any[]>): Promise<void> {
      const id = MongoID.idParse(msg.id);
      const serverDoc = this._getServerDoc(msg.collection, id);

      if (serverDoc) {
        const isExisting = serverDoc.document !== undefined;
        serverDoc.document = msg.fields || Object.create(null);
        serverDoc.document._id = id;

        if (this._resetStores) {
          const currentDoc = await this._stores[msg.collection].getDoc(msg.id);
          if (currentDoc !== undefined) msg.fields = currentDoc;
          this._pushUpdate(updates, msg.collection, msg);
        } else if (isExisting) {
          throw new Error(`Server sent add for existing id: ${msg.id}`);
        }
      } else {
        this._pushUpdate(updates, msg.collection, msg);
      }
    }

    public _process_changed(msg: any, updates: Record<string, any[]>): void {
      const serverDoc = this._getServerDoc(msg.collection, MongoID.idParse(msg.id));
      if (serverDoc) {
        if (serverDoc.document === undefined) throw new Error(`Server sent changed for nonexisting id: ${msg.id}`);
        DiffSequence.applyChanges(serverDoc.document, msg.fields);
      } else {
        this._pushUpdate(updates, msg.collection, msg);
      }
    }

    public _process_removed(msg: any, updates: Record<string, any[]>): void {
      const serverDoc = this._getServerDoc(msg.collection, MongoID.idParse(msg.id));
      if (serverDoc) {
        if (serverDoc.document === undefined) throw new Error(`Server sent removed for nonexisting id: ${msg.id}`);
        serverDoc.document = undefined;
      } else {
        this._pushUpdate(updates, msg.collection, { msg: 'removed', collection: msg.collection, id: msg.id });
      }
    }

    public _process_ready(msg: any, _updates: Record<string, any[]>): void {
      if (!msg.subs) return;
      msg.subs.forEach((subId: string) => {
        this._runWhenAllServerDocsAreFlushed(() => {
          const subRecord = this._subscriptions[subId];
          if (!subRecord || subRecord.ready) return;
          subRecord.ready = true;
          if (subRecord.readyCallback) subRecord.readyCallback();
          subRecord.readyDeps.changed();
        });
      });
    }

    public _process_updated(msg: any, updates: Record<string, any[]>): void {
      if (!msg.methods) return;
      msg.methods.forEach((methodId: string) => {
        const docs = this._documentsWrittenByStub[methodId] || {};
        Object.values(docs).forEach((written: any) => {
          const serverDoc = this._getServerDoc(written.collection, written.id);
          if (!serverDoc) throw new Error(`Lost serverDoc for ${JSON.stringify(written)}`);
          if (!serverDoc.writtenByStubs[methodId]) throw new Error(`Doc ${JSON.stringify(written)} not written by method ${methodId}`);

          delete serverDoc.writtenByStubs[methodId];

          if (Object.keys(serverDoc.writtenByStubs).length === 0) {
            this._pushUpdate(updates, written.collection, {
              msg: 'replace',
              id: MongoID.idStringify(written.id),
              replace: serverDoc.document
            });
            serverDoc.flushCallbacks.forEach((c: () => void) => c());
            this._serverDocuments[written.collection].remove(written.id);
          }
        });

        delete this._documentsWrittenByStub[methodId];

        const callbackInvoker = this._methodInvokers[methodId];
        if (!callbackInvoker) throw new Error(`No callback invoker for method ${methodId}`);
        this._runWhenAllServerDocsAreFlushed(() => callbackInvoker.dataVisible());
      });
    }

    public _pushUpdate(updates: Record<string, any[]>, collection: string, msg: any): void {
      if (!Object.prototype.hasOwnProperty.call(updates, collection)) {
        updates[collection] = [];
      }
      updates[collection].push(msg);
    }

    public _getServerDoc(collection: string, id: string | number | MongoID.ObjectID | undefined): any {
      if (!Object.prototype.hasOwnProperty.call(this._serverDocuments, collection)) return null;
      return this._serverDocuments[collection].get(id) || null;
    }
  };
}

// 2. Export the exact InstanceType resulting from this mixin so the next mixin knows about its methods!
export type DocumentProcessorsInstance = InstanceType<ReturnType<typeof DocumentProcessorsMixin<Constructor<BaseConnection>>>>;