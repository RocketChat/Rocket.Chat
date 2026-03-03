import { Cursor, type CursorOptions } from './cursor.ts';
import { IdMap } from './id-map.ts';
import { ObserveQueue } from './observe-queue.ts';
import { DiffSequence } from 'meteor/diff-sequence'; // Adjust to your ported path
import { isPlainObject, Matcher } from './matcher.ts'; // Note: Your Matcher code goes here
import { Sorter } from './sorter.ts'; // Note: Your Sorter code goes here
import { modify } from './modifiers.ts'; // Note: Extracted from LocalCollection._modify
import type { MongoID } from 'meteor/mongo-id';
import { Tracker } from 'meteor/tracker';
import { EJSON } from 'meteor/ejson';

const generateId = () => Math.random().toString(36).substring(2, 15);
const hasOwn = Object.prototype.hasOwnProperty;

type Doc = { _id?: string | MongoID.ObjectID | undefined;[key: string]: any };
type Transform<TDoc, TDocTransformed> = {
  (doc: TDoc): TDocTransformed;
  __wrappedTransform__?: boolean;
};

export class LocalCollection<TDoc extends Doc> {
  public name: string | null;
  public _docs: IdMap<TDoc>;
  public _observeQueue: ObserveQueue;
  public queries: Record<string, any>;
  public next_qid: number = 1;
  public paused: boolean = false;

  private _savedOriginals: IdMap<TDoc> | null = null;

  // Inject dependencies for cursor execution
  public Matcher = Matcher;
  public Sorter = Sorter;

  constructor(name: string | null = null) {
    this.name = name;
    this._docs = new IdMap();
    this._observeQueue = new ObserveQueue();
    this.queries = Object.create(null);
  }


  static wrapTransform(transform: null | undefined): null;
  static wrapTransform<T>(transform: () => T): ((doc: any) => T);
  static wrapTransform<TDoc extends Doc, TDocTransformed extends Partial<Doc>>(transform: Transform<TDoc, TDocTransformed>): ((doc: TDoc) => TDocTransformed);
  static wrapTransform<TDoc extends Doc, TDocTransformed extends Partial<Doc>>(transform: Transform<TDoc, TDocTransformed> | null | undefined): ((doc: TDoc) => TDocTransformed) | null {
    if (!transform) {
      return null;
    }

    // No need to doubly-wrap transforms.
    if (transform.__wrappedTransform__) {
      return transform;
    }

    const wrapped = (doc: TDoc) => {
      if (!hasOwn.call(doc, '_id')) {
        // XXX do we ever have a transform on the oplog's collection? because that
        // collection has no _id.
        throw new Error('can only transform documents with _id');
      }

      const id = doc._id;

      // XXX consider making tracker a weak dependency and checking
      // Package.tracker here
      const transformed = Tracker.nonreactive(() => transform(doc));

      if (!isPlainObject(transformed)) {
        throw new Error('transform must return object');
      }

      if (hasOwn.call(transformed, '_id')) {
        if (!EJSON.equals(transformed._id, id)) {
          throw new Error('transformed document can\'t have different _id');
        }
      } else {
        transformed._id = id;
      }

      return transformed;
    };

    wrapped.__wrappedTransform__ = true;

    return wrapped;
  }

  find<TDocTransformed extends TDoc>(selector: any = {}, options: CursorOptions<TDoc, TDocTransformed> = {}): Cursor<TDoc, TDocTransformed> {
    return new Cursor(this, selector, options);
  }

  findOne<TDocTransformed extends TDoc>(selector: any = {}, options: { transform?: Transform<TDoc, TDocTransformed> | null | undefined } = {}): TDocTransformed | undefined {
    return this.find(selector, { ...options, limit: 1 }).fetch()[0];
  }

  findOneAsync(selector: any = {}, options: any = {}): Promise<any> {
    return Promise.resolve(this.findOne(selector, options));
  }

  insert(doc: any): string {
    doc = structuredClone(doc);
    const id = doc._id || generateId();
    doc._id = id;

    if (this._docs.has(id)) throw new Error(`Duplicate _id '${id}'`);

    this._saveOriginal(id, undefined);
    this._docs.set(id, doc);

    const queriesToRecompute: string[] = [];

    for (const [qid, query] of Object.entries(this.queries)) {
      if (query.dirty) continue;
      if (query.matcher.documentMatches(doc).result) {
        if (query.cursor.skip || query.cursor.limit) {
          queriesToRecompute.push(qid);
        } else {
          const fields = structuredClone(doc);
          delete fields._id;
          if (query.ordered) {
            query.addedBefore(id, fields, null);
            query.results.push(doc);
          } else {
            query.added(id, fields);
            query.results.set(id, doc);
          }
        }
      }
    }

    queriesToRecompute.forEach(qid => this._recomputeResults(this.queries[qid]));
    this._observeQueue.drain();

    return id;
  }

  async insertAsync(doc: any): Promise<string> {
    return Promise.resolve(this.insert(doc));
  }

  update(selector: any, modifier: any, options: any = {}): any {
    const matcher = new this.Matcher(selector);
    let updateCount = 0;

    const docsToUpdate = Array.from(this._docs.entries())
      .filter(([_id, doc]) => matcher.documentMatches(doc).result)
      .map(([id, doc]) => ({ id, doc }));

    for (const { id, doc } of docsToUpdate) {
      this._saveOriginal(id, doc);
      const oldDoc = structuredClone(doc);

      modify(doc, modifier, { isInsert: false });

      // Notify Observers
      for (const query of Object.values(this.queries)) {
        if (query.dirty) continue;

        const before = matcher.documentMatches(oldDoc).result;
        const after = query.matcher.documentMatches(doc).result;

        if (query.cursor.skip || query.cursor.limit) {
          if (before || after) this._recomputeResults(query);
        } else if (before && !after) {
          query.removed(id);
          if (query.ordered) query.results = query.results.filter((d: any) => d._id !== id);
          else query.results.delete(id);
        } else if (!before && after) {
          const { _id, ...rest } = doc;
          const fields = structuredClone(rest);
          if (query.ordered) { query.addedBefore(id, fields, null); query.results.push(doc); }
          else { query.added(id, fields); query.results.set(id, doc); }
        } else if (before && after) {
          query.changed(id, doc);
        }
      }

      updateCount++;
      if (!options.multi) break;
    }

    this._observeQueue.drain();

    let insertedId;
    if (updateCount === 0 && options.upsert) {
      const newDoc: any = { _id: options.insertedId || generateId() };

      // Shallow extraction of simple equality fields from the selector
      if (selector && typeof selector === 'object') {
        for (const key of Object.keys(selector)) {
          if (!key.startsWith('$') && typeof selector[key] !== 'object') {
            newDoc[key] = selector[key];
          }
        }
      }

      // Check if modifier is a replacement object or a $ operator object
      if (typeof modifier === 'object' && Object.keys(modifier).some(k => k.startsWith('$'))) {
        modify(newDoc, modifier, { isInsert: true });
      } else {
        Object.assign(newDoc, modifier);
      }

      insertedId = newDoc._id;
      this.insert(newDoc);
      updateCount = 1;
    }

    if (options._returnObject) {
      return { numberAffected: updateCount, insertedId };
    }

    return updateCount;
  }

  updateAsync(selector: any, modifier: any, options: any = {}): Promise<{ numberAffected: number; insertedId?: string }> {
    return Promise.resolve(this.update(selector, modifier, options));
  }

  upsert(selector: any, modifier: any, options: any = {}): { numberAffected: number; insertedId?: string } {
    return this.update(selector, modifier, { ...options, upsert: true, _returnObject: true });
  }

  upsertAsync(selector: any, modifier: any, options: any = {}): Promise<{ numberAffected: number; insertedId?: string }> {
    return Promise.resolve(this.upsert(selector, modifier, options));
  }

  remove(selector: any): number {
    if (this.paused && !this._savedOriginals && Object.keys(selector).length === 0) {
      const size = this._docs.size;
      this._docs.clear();
      return size;
    }

    const matcher = new Matcher(selector);
    const removeIds: string[] = [];

    this._docs.forEach((doc, id) => {
      if (matcher.documentMatches(doc).result) removeIds.push(id);
    });

    for (const id of removeIds) {
      const doc = this._docs.get(id);
      this._saveOriginal(id, doc);

      for (const query of Object.values(this.queries)) {
        if (query.dirty) continue;
        if (query.matcher.documentMatches(doc).result) {
          if (query.cursor.skip || query.cursor.limit) {
            this._recomputeResults(query);
          } else {
            query.removed(id);
            if (query.ordered) query.results = query.results.filter((d: any) => d._id !== id);
            else query.results.delete(id);
          }
        }
      }
      this._docs.remove(id);
    }

    this._observeQueue.drain();
    return removeIds.length;
  }

  removeAsync(selector: any): Promise<number> {
    return Promise.resolve(this.remove(selector));
  }

  // --- Observation Latency Compensation --- //

  pauseObservers() {
    if (this.paused) return;
    this.paused = true;
    for (const query of Object.values(this.queries)) {
      query.resultsSnapshot = structuredClone(query.results);
    }
  }

  resumeObserversClient() {
    if (!this.paused) return;
    this.paused = false;

    for (const query of Object.values(this.queries)) {
      if (query.dirty) {
        query.dirty = false;
        this._recomputeResults(query, query.resultsSnapshot);
      } else {
        DiffSequence.diffQueryChanges(query.ordered, query.resultsSnapshot, query.results, query);
      }
      query.resultsSnapshot = null;
    }
    this._observeQueue.drain();
  }

  saveOriginals() {
    if (this._savedOriginals) throw new Error('Called saveOriginals twice without retrieveOriginals');
    this._savedOriginals = new IdMap();
  }

  retrieveOriginals(): IdMap {
    if (!this._savedOriginals) throw new Error('Called retrieveOriginals without saveOriginals');
    const originals = this._savedOriginals;
    this._savedOriginals = null;
    return originals;
  }

  private _saveOriginal(id: string, doc: any) {
    if (!this._savedOriginals || this._savedOriginals.has(id)) return;
    this._savedOriginals.set(id, doc ? structuredClone(doc) : undefined);
  }

  private _recomputeResults(query: any, oldResults?: any) {
    if (this.paused) {
      query.dirty = true;
      return;
    }

    if (!oldResults) oldResults = query.results;
    query.results = query.cursor._getRawObjects({ ordered: query.ordered });
    DiffSequence.diffQueryChanges(query.ordered, oldResults, query.results, query);
  }
}