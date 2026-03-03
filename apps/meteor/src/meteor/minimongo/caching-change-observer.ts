import { DiffSequence } from 'meteor/diff-sequence'; // Adjust to your ported path
import { IdMap } from './id-map.ts'; // Note: Your IdMap code goes here

export class CachingChangeObserver<T extends { _id: string }> {
  public ordered: boolean;
  public docs: IdMap<T>;
  public orderedDocs: T[]; // Used if ordered is true
  public applyChange: Record<string, Function>;

  constructor(options: { ordered: boolean; callbacks: any }) {
    this.ordered = options.ordered;
    const callbacks = options.callbacks || {};

    this.docs = new IdMap<T>();
    this.orderedDocs = [];

    if (this.ordered) {
      this.applyChange = {
        addedBefore: (id: string, fields: any, before: string | null) => {
          const doc = { _id: id, ...fields };

          if (callbacks.addedBefore) callbacks.addedBefore.call(this, id, structuredClone(fields), before);
          if (callbacks.added) callbacks.added.call(this, id, structuredClone(fields));

          this.docs.set(id, doc);
          const beforeIdx = before ? this.orderedDocs.findIndex(d => d._id === before) : -1;
          if (beforeIdx === -1) this.orderedDocs.push(doc);
          else this.orderedDocs.splice(beforeIdx, 0, doc);
        },
        movedBefore: (id: string, before: string | null) => {
          if (callbacks.movedBefore) callbacks.movedBefore.call(this, id, before);
          const doc = this.docs.get(id);
          if (!doc) return;

          this.orderedDocs = this.orderedDocs.filter(d => d._id !== id);
          const beforeIdx = before ? this.orderedDocs.findIndex(d => d._id === before) : -1;
          if (beforeIdx === -1) this.orderedDocs.push(doc);
          else this.orderedDocs.splice(beforeIdx, 0, doc);
        }
      };
    } else {
      this.applyChange = {
        added: (id: string, fields: any) => {
          const doc = { _id: id, ...fields };
          if (callbacks.added) callbacks.added.call(this, id, structuredClone(fields));
          this.docs.set(id, doc);
        }
      };
    }

    this.applyChange.changed = (id: string, fields: any) => {
      const doc = this.docs.get(id);
      if (!doc) throw new Error(`Unknown id for changed: ${id}`);

      if (callbacks.changed) callbacks.changed.call(this, id, structuredClone(fields));
      DiffSequence.applyChanges(doc, fields); // From your ported diff-sequence
    };

    this.applyChange.removed = (id: string) => {
      if (callbacks.removed) callbacks.removed.call(this, id);
      this.docs.remove(id);
      if (this.ordered) this.orderedDocs = this.orderedDocs.filter(d => d._id !== id);
    };
  }
}