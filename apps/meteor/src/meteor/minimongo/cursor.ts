import { Tracker } from 'meteor/tracker';
import { DiffSequence } from 'meteor/diff-sequence';
import { CachingChangeObserver } from './caching-change-observer.ts';
import { LocalCollection } from './local-collection.ts';
import type { Matcher } from './matcher.ts';
import type { Sorter } from './sorter.ts';
import type { MongoID } from 'meteor/mongo-id';

export type CursorOptions<TDoc, TDocTransformed extends TDoc> = {
    sort?: any;
    skip?: number;
    limit?: number;
    reactive?: boolean;
    transform?: ((doc: TDoc) => TDocTransformed) | null | undefined;
}


export class Cursor<TDoc extends { _id?: string | MongoID.ObjectID | undefined }, TDocTransformed extends TDoc = TDoc> {
    private collection: LocalCollection<TDoc>;
    private matcher: Matcher;
    private sorter: Sorter | null = null;
    private skip: number;
    private limit: number | undefined;
    private reactive: boolean;
    private _selectorId?: string;

    constructor(collection: LocalCollection<TDoc>, selector: any, options: CursorOptions<TDoc, TDocTransformed> = {}) {
        this.collection = collection;
        this.matcher = new collection.Matcher(selector); // Pass your Matcher implementation here

        if (typeof selector === "string") {
            this._selectorId = selector;
        } else if (selector && typeof selector._id === "string" && Object.keys(selector).length === 1) {
            this._selectorId = selector._id;
        }

        if (!this._selectorId && options.sort) {
            this.sorter = new collection.Sorter(options.sort); // Pass your Sorter implementation here
        }

        this.skip = options.skip || 0;
        this.limit = options.limit;
        this.reactive = options.reactive !== false && typeof Tracker !== 'undefined';
    }

    fetch(): TDocTransformed[] {
        const result: TDocTransformed[] = [];
        this.forEach(doc => result.push(doc));
        return result;
    }

    fetchAsync(): Promise<TDocTransformed[]> {
        return Promise.resolve(this.fetch());
    }

    count(): number {
        if (this.reactive) this._depend({ added: true, removed: true });
        return this._getRawObjects({ ordered: true }).length;
    }

    forEach(callback: (doc: TDocTransformed, index: number) => void, thisArg?: any) {
        if (this.reactive) {
            this._depend({ addedBefore: true, removed: true, changed: true, movedBefore: true });
        }

        this._getRawObjects({ ordered: true }).forEach((element: any, i: number) => {
            callback.call(thisArg, structuredClone(element), i);
        });
    }

    map<U>(callback: (doc: TDocTransformed, index: number) => U, thisArg?: any): U[] {
        const result: U[] = [];
        this.forEach((doc, i) => result.push(callback.call(thisArg, doc, i)));
        return result;
    }

    observe(callbacks: any): { stop: () => void; } {
        // Determine if it's ordered based on callbacks
        const ordered = !!(callbacks.addedAt || callbacks.changedAt || callbacks.movedTo || callbacks.removedAt);

        const changeObserver = new CachingChangeObserver({
            ordered,
            callbacks: this._wrapObserveCallbacks(callbacks, ordered)
        });

        return this.observeChanges(changeObserver.applyChange, ordered);
    }

    observeChanges(callbacks: any, ordered = false) {
        const query: any = {
            cursor: this,
            ordered,
            matcher: this.matcher,
            sorter: this.sorter,
            resultsSnapshot: null
        };

        let qid: number | undefined;

        if (this.reactive) {
            qid = this.collection.next_qid++;
            this.collection.queries[qid] = query;
        }

        query.results = this._getRawObjects({ ordered });

        if (this.collection.paused) {
            query.resultsSnapshot = ordered ? [] : new Map();
        }

        // Wrap callbacks to queue them
        const wrapCb = (fn: Function) => fn ? (...args: any[]) => {
            if (!this.collection.paused) {
                this.collection._observeQueue.queueTask(() => fn(...args));
            }
        } : () => { };

        query.added = wrapCb(callbacks.added);
        query.changed = wrapCb(callbacks.changed);
        query.removed = wrapCb(callbacks.removed);
        if (ordered) {
            query.addedBefore = wrapCb(callbacks.addedBefore);
            query.movedBefore = wrapCb(callbacks.movedBefore);
        }

        // Initial Adds
        if (!this.collection.paused) {
            const handler = (doc: any) => {
                const fields = structuredClone(doc);
                delete fields._id;
                if (ordered) query.addedBefore(doc._id, fields, null);
                else query.added(doc._id, fields);
            };

            if (Array.isArray(query.results)) query.results.forEach(handler);
            else query.results.forEach(handler);
        }

        const handle = {
            stop: () => {
                if (this.reactive && qid) delete this.collection.queries[qid];
            }
        };

        if (this.reactive && Tracker.active) {
            Tracker.onInvalidate(() => handle.stop());
        }

        this.collection._observeQueue.drain();
        return handle;
    }

    private _depend(changers: any) {
        if (Tracker.active) {
            const dependency = new Tracker.Dependency();
            const notify = () => dependency.changed();
            dependency.depend();

            const options: any = { _suppress_initial: true };
            ['added', 'addedBefore', 'changed', 'movedBefore', 'removed'].forEach(fn => {
                if (changers[fn]) options[fn] = notify;
            });

            this.observeChanges(options, !!changers.addedBefore);
        }
    }

    private _getRawObjects<TOrdered extends boolean>(options: { ordered: TOrdered }): TOrdered extends true ? any[] : Map<string, any> {
        const results = options.ordered ? new Array() : new Map();
        const ordered = results instanceof Array;

        if (this._selectorId !== undefined) {
            const selectedDoc = this.collection._docs.get(this._selectorId);
            if (selectedDoc) {
                if (ordered) results.push(selectedDoc);
                else results.set(this._selectorId, selectedDoc);
            }
            return results as any;
        }

        this.collection._docs.forEach((doc, id) => {
            if (this.matcher.documentMatches(doc).result) {
                if (ordered) results.push(doc);
                else results.set(id, doc);
            }
        });

        if (ordered && this.sorter) {
            results.sort(this.sorter.getComparator());
        }

        if (ordered && (this.skip || this.limit)) {
            const start = this.skip;
            const end = this.limit ? start + this.limit : (results as any[]).length;
            return results.slice(start, end) as any;
        }

        return results as any;
    }

    private _wrapObserveCallbacks(observeCallbacks: any, ordered: boolean): any {
        // Use the cursor's transform if defined, otherwise pass the document through as-is
        const transform = (this as any)._transform || ((doc: any) => doc);

        // Track whether we should suppress initial 'added' events (used by Tracker.autorun)
        let suppressed = !!observeCallbacks._suppress_initial;

        // The "_no_indices" option skips the linear scans required to generate absolute indices
        const indices = ordered && !observeCallbacks._no_indices;

        if (ordered) {
            return {
                addedBefore: function (this: any, id: string, fields: any, before: string | null) {
                    if (suppressed || !(observeCallbacks.addedAt || observeCallbacks.added)) {
                        return;
                    }

                    const doc = transform({ _id: id, ...fields });

                    if (observeCallbacks.addedAt) {
                        const index = indices
                            ? before
                                ? this.orderedDocs.findIndex((d: any) => d._id === before)
                                : this.orderedDocs.length
                            : -1;
                        observeCallbacks.addedAt(doc, index, before);
                    } else {
                        observeCallbacks.added(doc);
                    }
                },

                changed: function (this: any, id: string, fields: any) {
                    if (!(observeCallbacks.changedAt || observeCallbacks.changed)) {
                        return;
                    }

                    const doc = this.docs.get(id);
                    if (!doc) {
                        throw new Error(`Unknown id for changed: ${id}`);
                    }

                    // We clone the old doc before applying changes to pass to the user callback
                    const oldDoc = transform(structuredClone(doc));

                    // Calculate what the new doc will look like (CachingChangeObserver updates its own cache right after this)
                    const newDoc = structuredClone(doc);
                    DiffSequence.applyChanges(newDoc, fields);

                    if (observeCallbacks.changedAt) {
                        const index = indices ? this.orderedDocs.findIndex((d: any) => d._id === id) : -1;
                        observeCallbacks.changedAt(transform(newDoc), oldDoc, index);
                    } else {
                        observeCallbacks.changed(transform(newDoc), oldDoc);
                    }
                },

                movedBefore: function (this: any, id: string, before: string | null) {
                    if (!observeCallbacks.movedTo) {
                        return;
                    }

                    const from = indices ? this.orderedDocs.findIndex((d: any) => d._id === id) : -1;
                    let to = indices
                        ? before
                            ? this.orderedDocs.findIndex((d: any) => d._id === before)
                            : this.orderedDocs.length
                        : -1;

                    // When moving forwards, adjust for the fact that the document is removed from its old position
                    if (to > from) {
                        --to;
                    }

                    const doc = transform(structuredClone(this.docs.get(id)));
                    observeCallbacks.movedTo(doc, from, to, before || null);
                },

                removed: function (this: any, id: string) {
                    if (!(observeCallbacks.removedAt || observeCallbacks.removed)) {
                        return;
                    }

                    const doc = transform(this.docs.get(id));

                    if (observeCallbacks.removedAt) {
                        const index = indices ? this.orderedDocs.findIndex((d: any) => d._id === id) : -1;
                        observeCallbacks.removedAt(doc, index);
                    } else {
                        observeCallbacks.removed(doc);
                    }
                }
            };
        } else {
            // Unordered logic is much simpler because we don't care about indices
            return {
                added: function (this: any, id: string, fields: any) {
                    if (!suppressed && observeCallbacks.added) {
                        observeCallbacks.added(transform({ _id: id, ...fields }));
                    }
                },

                changed: function (this: any, id: string, fields: any) {
                    if (observeCallbacks.changed) {
                        const oldDoc = this.docs.get(id);
                        const newDoc = structuredClone(oldDoc);

                        DiffSequence.applyChanges(newDoc, fields);

                        observeCallbacks.changed(
                            transform(newDoc),
                            transform(structuredClone(oldDoc))
                        );
                    }
                },

                removed: function (this: any, id: string) {
                    if (observeCallbacks.removed) {
                        observeCallbacks.removed(transform(this.docs.get(id)));
                    }
                }
            };
        }
    }
}