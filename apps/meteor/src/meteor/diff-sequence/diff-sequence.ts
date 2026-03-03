import { EJSON } from 'meteor/ejson'; // Assuming EJSON is provided via a stub or npm package

const hasOwn = Object.prototype.hasOwnProperty;

function isObjEmpty(obj: any): boolean {
  for (let key in Object(obj)) {
    if (hasOwn.call(obj, key)) {
      return false;
    }
  }
  return true;
}

export type Document = {
  _id: any;
  [key: string]: any;
};

export type Observer = {
  added?: (id: any, fields: Partial<Document>) => void;
  addedBefore?: (id: any, fields: Partial<Document>, before: any | null) => void;
  changed?: (id: any, fields: Partial<Document>) => void;
  movedBefore?: (id: any, before: any | null) => void;
  removed?: (id: any) => void;
};

export type DiffOptions = {
  projectionFn?: (doc: Document) => Document;
};

export type DiffCallbacks = {
  leftOnly?: (key: any, leftValue: any) => void;
  rightOnly?: (key: any, rightValue: any) => void;
  both?: (key: any, leftValue: any, rightValue: any) => void;
};

export const applyChanges = (doc: Document, changeFields: Partial<Document>) => {
  Object.keys(changeFields).forEach((key) => {
    const value = changeFields[key];
    if (typeof value === "undefined") {
      delete doc[key];
    } else {
      doc[key] = value;
    }
  });
}

export const DiffSequence = {
  diffQueryChanges(
    ordered: boolean,
    oldResults: any,
    newResults: any,
    observer: Observer,
    options?: DiffOptions
  ) {
    if (ordered) {
      DiffSequence.diffQueryOrderedChanges(oldResults, newResults, observer, options);
    } else {
      DiffSequence.diffQueryUnorderedChanges(oldResults, newResults, observer, options);
    }
  },

  diffQueryUnorderedChanges(
    oldResults: Map<any, Document>,
    newResults: Map<any, Document>,
    observer: Observer,
    options: DiffOptions = {}
  ) {
    const projectionFn = options.projectionFn || EJSON.clone;

    if (observer.movedBefore) {
      throw new Error("_diffQueryUnordered called with a movedBefore observer!");
    }

    newResults.forEach((newDoc, id) => {
      const oldDoc = oldResults.get(id);
      if (oldDoc) {
        if (observer.changed && !EJSON.equals(oldDoc, newDoc)) {
          const projectedNew = projectionFn(newDoc);
          const projectedOld = projectionFn(oldDoc);
          const changedFields = DiffSequence.makeChangedFields(projectedNew, projectedOld);

          if (!isObjEmpty(changedFields)) {
            observer.changed(id, changedFields);
          }
        }
      } else if (observer.added) {
        const fields = projectionFn(newDoc);
        delete fields._id;
        observer.added(newDoc._id, fields);
      }
    });

    if (observer.removed) {
      oldResults.forEach((_oldDoc, id) => {
        if (!newResults.has(id)) {
          observer.removed!(id);
        }
      });
    }
  },

  diffQueryOrderedChanges(
    old_results: Document[],
    new_results: Document[],
    observer: Observer,
    options: DiffOptions = {}
  ) {
    const projectionFn = options.projectionFn || EJSON.clone;

    const new_presence_of_id: Record<string, boolean> = {};
    new_results.forEach((doc) => {
      if (new_presence_of_id[doc._id]) console.debug("Duplicate _id in new_results");
      new_presence_of_id[doc._id] = true;
    });

    const old_index_of_id: Record<string, number> = {};
    old_results.forEach((doc, i) => {
      if (doc._id in old_index_of_id) console.debug("Duplicate _id in old_results");
      old_index_of_id[doc._id] = i;
    });

    const unmoved: number[] = [];
    let max_seq_len = 0;
    const N = new_results.length;
    const seq_ends = new Array<number>(N);
    const ptrs = new Array<number>(N);

    const old_idx_seq = (i_new: number) => old_index_of_id[new_results[i_new]._id];

    for (let i = 0; i < N; i++) {
      if (old_index_of_id[new_results[i]._id] !== undefined) {
        let j = max_seq_len;
        while (j > 0) {
          if (old_idx_seq(seq_ends[j - 1]) < old_idx_seq(i)) break;
          j--;
        }

        ptrs[i] = j === 0 ? -1 : seq_ends[j - 1];
        seq_ends[j] = i;
        if (j + 1 > max_seq_len) max_seq_len = j + 1;
      }
    }

    let idx = max_seq_len === 0 ? -1 : seq_ends[max_seq_len - 1];
    while (idx >= 0) {
      unmoved.push(idx);
      idx = ptrs[idx];
    }
    unmoved.reverse();
    unmoved.push(new_results.length);

    old_results.forEach((doc) => {
      if (!new_presence_of_id[doc._id]) {
        observer.removed && observer.removed(doc._id);
      }
    });

    let startOfGroup = 0;
    unmoved.forEach((endOfGroup) => {
      const groupId = new_results[endOfGroup] ? new_results[endOfGroup]._id : null;
      let oldDoc, newDoc, fields, projectedNew, projectedOld;

      for (let i = startOfGroup; i < endOfGroup; i++) {
        newDoc = new_results[i];
        if (!hasOwn.call(old_index_of_id, newDoc._id)) {
          fields = projectionFn(newDoc);
          delete fields._id;
          observer.addedBefore && observer.addedBefore(newDoc._id, fields, groupId);
          observer.added && observer.added(newDoc._id, fields);
        } else {
          oldDoc = old_results[old_index_of_id[newDoc._id]];
          projectedNew = projectionFn(newDoc);
          projectedOld = projectionFn(oldDoc);
          fields = DiffSequence.makeChangedFields(projectedNew, projectedOld);
          if (!isObjEmpty(fields)) {
            observer.changed && observer.changed(newDoc._id, fields);
          }
          observer.movedBefore && observer.movedBefore(newDoc._id, groupId);
        }
      }

      if (groupId) {
        newDoc = new_results[endOfGroup];
        oldDoc = old_results[old_index_of_id[newDoc._id]];
        projectedNew = projectionFn(newDoc);
        projectedOld = projectionFn(oldDoc);
        fields = DiffSequence.makeChangedFields(projectedNew, projectedOld);
        if (!isObjEmpty(fields)) {
          observer.changed && observer.changed(newDoc._id, fields);
        }
      }
      startOfGroup = endOfGroup + 1;
    });
  },

  diffObjects(left: Record<string, any>, right: Record<string, any>, callbacks: DiffCallbacks) {
    Object.keys(left).forEach((key) => {
      const leftValue = left[key];
      if (hasOwn.call(right, key)) {
        callbacks.both && callbacks.both(key, leftValue, right[key]);
      } else {
        callbacks.leftOnly && callbacks.leftOnly(key, leftValue);
      }
    });

    if (callbacks.rightOnly) {
      Object.keys(right).forEach((key) => {
        const rightValue = right[key];
        if (!hasOwn.call(left, key)) {
          callbacks.rightOnly!(key, rightValue);
        }
      });
    }
  },

  diffMaps(left: Map<any, any>, right: Map<any, any>, callbacks: DiffCallbacks) {
    left.forEach((leftValue, key) => {
      if (right.has(key)) {
        callbacks.both && callbacks.both(key, leftValue, right.get(key));
      } else {
        callbacks.leftOnly && callbacks.leftOnly(key, leftValue);
      }
    });

    if (callbacks.rightOnly) {
      right.forEach((rightValue, key) => {
        if (!left.has(key)) {
          callbacks.rightOnly!(key, rightValue);
        }
      });
    }
  },

  makeChangedFields(newDoc: Document, oldDoc: Document): Partial<Document> {
    const fields: Partial<Document> = {};
    DiffSequence.diffObjects(oldDoc, newDoc, {
      leftOnly: (key) => {
        fields[key] = undefined;
      },
      rightOnly: (key, value) => {
        fields[key] = value;
      },
      both: (key, leftValue, rightValue) => {
        if (!EJSON.equals(leftValue, rightValue)) {
          fields[key] = rightValue;
        }
      }
    });
    return fields;
  },

  applyChanges,
};