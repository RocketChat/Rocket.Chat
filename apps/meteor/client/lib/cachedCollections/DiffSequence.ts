import type { IdMap } from './IdMap';
import { clone, hasOwn, isEqual } from './common';

function isObjEmpty(obj: Record<string, unknown>): boolean {
	for (const key in Object(obj)) {
		if (hasOwn.call(obj, key)) {
			return false;
		}
	}
	return true;
}

type Observer<T extends { _id: string }> = {
	added?: <TFields>(id: T['_id'], fields: TFields) => void;
	changed?: <TFields>(id: T['_id'], fields: TFields) => void;
	removed?: (id: T['_id']) => void;
	movedBefore?: (id: T['_id'], before: T['_id'] | null) => void;
	addedBefore?: <TFields>(id: T['_id'], fields: TFields, before: T['_id'] | null) => void;
};

export class DiffSequence {
	// ordered: bool.
	// old_results and new_results: collections of documents.
	//    if ordered, they are arrays.
	//    if unordered, they are IdMaps
	static diffQueryChanges<T extends { _id: string }, TProjection extends T = T>(
		ordered: true,
		oldResults: T[],
		newResults: T[],
		observer: Observer<T>,
		options?: { projectionFn?: (doc: T | Omit<T, '_id'>) => TProjection },
	): void;

	static diffQueryChanges<T extends { _id: string }, TProjection extends T = T>(
		ordered: false,
		oldResults: IdMap<T['_id'], T>,
		newResults: IdMap<T['_id'], T>,
		observer: Observer<T>,
		options?: { projectionFn?: (doc: T | Omit<T, '_id'>) => TProjection },
	): void;

	static diffQueryChanges<T extends { _id: string }, TProjection extends T = T>(
		ordered: boolean,
		oldResults: T[] | IdMap<T['_id'], T>,
		newResults: T[] | IdMap<T['_id'], T>,
		observer: Observer<T>,
		options?: { projectionFn?: (doc: T | Omit<T, '_id'>) => TProjection },
	): void;

	static diffQueryChanges<T extends { _id: string }, TProjection extends T = T>(
		ordered: boolean,
		oldResults: T[] | IdMap<T['_id'], T>,
		newResults: T[] | IdMap<T['_id'], T>,
		observer: Observer<T>,
		options?: { projectionFn?: (doc: T | Omit<T, '_id'>) => TProjection },
	): void {
		if (ordered) DiffSequence.diffQueryOrderedChanges(oldResults as T[], newResults as T[], observer, options);
		else DiffSequence.diffQueryUnorderedChanges(oldResults as IdMap<T['_id'], T>, newResults as IdMap<T['_id'], T>, observer, options);
	}

	private static diffQueryUnorderedChanges<T extends { _id: string }, TProjection extends T = T>(
		oldResults: IdMap<T['_id'], T>,
		newResults: IdMap<T['_id'], T>,
		observer: Observer<T>,
		options?: { projectionFn?: (doc: T | Omit<T, '_id'>) => TProjection },
	): void {
		options = options || {};
		const projectionFn = options.projectionFn || clone;

		if (observer.movedBefore) {
			throw new Error('_diffQueryUnordered called with a movedBefore observer!');
		}

		newResults.forEach((newDoc, id) => {
			const oldDoc = oldResults.get(id);
			if (oldDoc) {
				if (observer.changed && !isEqual(oldDoc, newDoc as any)) {
					const projectedNew = projectionFn(newDoc);
					const projectedOld = projectionFn(oldDoc);
					const changedFields = DiffSequence.makeChangedFields<unknown, unknown>(projectedNew, projectedOld);
					if (!isObjEmpty(changedFields)) {
						observer.changed(id, changedFields as TProjection);
					}
				}
			} else if (observer.added) {
				const fields = projectionFn(newDoc) as Omit<TProjection, '_id'> & { _id?: string };
				delete fields._id;
				observer.added(newDoc._id, fields);
			}
		});

		if (observer.removed) {
			oldResults.forEach((_oldDoc, id) => {
				if (!newResults.has(id)) observer.removed!(id);
			});
		}
	}

	private static diffQueryOrderedChanges<T extends { _id: string }, TProjection extends T = T>(
		oldResults: T[],
		newResults: T[],
		observer: Observer<T>,
		options?: { projectionFn?: (doc: T | Omit<T, '_id'>) => TProjection },
	): void {
		options = options || {};
		const projectionFn = options.projectionFn || clone;

		const newPresenceOfId = new Set<T['_id']>();
		newResults.forEach((doc) => {
			if (newPresenceOfId.has(doc._id)) Meteor._debug('Duplicate _id in new_results');
			newPresenceOfId.add(doc._id);
		});

		const oldIndexOfId = new Map<T['_id'], number>();
		oldResults.forEach((doc, i) => {
			if (doc._id in oldIndexOfId) Meteor._debug('Duplicate _id in old_results');
			oldIndexOfId.set(doc._id, i);
		});

		// ALGORITHM:
		//
		// To determine which docs should be considered "moved" (and which
		// merely change position because of other docs moving) we run
		// a "longest common subsequence" (LCS) algorithm.  The LCS of the
		// old doc IDs and the new doc IDs gives the docs that should NOT be
		// considered moved.

		// To actually call the appropriate callbacks to get from the old state to the
		// new state:

		// First, we call removed() on all the items that only appear in the old
		// state.

		// Then, once we have the items that should not move, we walk through the new
		// results array group-by-group, where a "group" is a set of items that have
		// moved, anchored on the end by an item that should not move.  One by one, we
		// move each of those elements into place "before" the anchoring end-of-group
		// item, and fire changed events on them if necessary.  Then we fire a changed
		// event on the anchor, and move on to the next group.  There is always at
		// least one group; the last group is anchored by a virtual "null" id at the
		// end.

		// Asymptotically: O(N k) where k is number of ops, or potentially
		// O(N log N) if inner loop of LCS were made to be binary search.

		// ////// LCS (longest common sequence, with respect to _id)
		// (see Wikipedia article on Longest Increasing Subsequence,
		// where the LIS is taken of the sequence of old indices of the
		// docs in new_results)
		//
		// unmoved: the output of the algorithm; members of the LCS,
		// in the form of indices into new_results
		const unmoved: number[] = [];
		// max_seq_len: length of LCS found so far
		let maxSeqLen = 0;
		// seq_ends[i]: the index into new_results of the last doc in a
		// common subsequence of length of i+1 <= max_seq_len
		const N = newResults.length;
		const seqEnds = new Array(N);
		// ptrs:  the common subsequence ending with new_results[n] extends
		// a common subsequence ending with new_results[ptr[n]], unless
		// ptr[n] is -1.
		const ptrs = new Array(N);
		// virtual sequence of old indices of new results
		const oldIdxSeq = function (iNew: number): number {
			return oldIndexOfId.get(newResults[iNew]._id)!;
		};
		// for each item in new_results, use it to extend a common subsequence
		// of length j <= max_seq_len
		for (let i = 0; i < N; i++) {
			if (oldIndexOfId.get(newResults[i]._id) !== undefined) {
				let j = maxSeqLen;
				// this inner loop would traditionally be a binary search,
				// but scanning backwards we will likely find a subseq to extend
				// pretty soon, bounded for example by the total number of ops.
				// If this were to be changed to a binary search, we'd still want
				// to scan backwards a bit as an optimization.
				while (j > 0) {
					if (oldIdxSeq(seqEnds[j - 1]) < oldIdxSeq(i)) break;
					j--;
				}

				ptrs[i] = j === 0 ? -1 : seqEnds[j - 1];
				seqEnds[j] = i;
				if (j + 1 > maxSeqLen) maxSeqLen = j + 1;
			}
		}

		// pull out the LCS/LIS into unmoved
		let idx = maxSeqLen === 0 ? -1 : seqEnds[maxSeqLen - 1];
		while (idx >= 0) {
			unmoved.push(idx);
			idx = ptrs[idx];
		}
		// the unmoved item list is built backwards, so fix that
		unmoved.reverse();

		// the last group is always anchored by the end of the result list, which is
		// an id of "null"
		unmoved.push(newResults.length);

		oldResults.forEach((doc) => {
			if (!newPresenceOfId.has(doc._id)) observer.removed?.(doc._id);
		});

		// for each group of things in the new_results that is anchored by an unmoved
		// element, iterate through the things before it.
		let startOfGroup = 0;
		unmoved.forEach((endOfGroup) => {
			const groupId = newResults[endOfGroup] ? newResults[endOfGroup]._id : null;
			let oldDoc;
			let newDoc;
			let fields;
			let projectedNew;
			let projectedOld;
			for (let i = startOfGroup; i < endOfGroup; i++) {
				newDoc = newResults[i];
				if (!hasOwn.call(oldIndexOfId, newDoc._id)) {
					fields = projectionFn(newDoc) as Omit<TProjection, '_id'> & { _id?: string };
					delete fields._id;
					observer.addedBefore && observer.addedBefore(newDoc._id, fields, groupId);
					observer.added?.(newDoc._id, fields);
				} else {
					// moved
					oldDoc = oldResults[oldIndexOfId.get(newDoc._id)!];
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
				newDoc = newResults[endOfGroup];
				oldDoc = oldResults[oldIndexOfId.get(newDoc._id)!];
				projectedNew = projectionFn(newDoc);
				projectedOld = projectionFn(oldDoc);
				fields = DiffSequence.makeChangedFields(projectedNew, projectedOld);
				if (!isObjEmpty(fields)) {
					observer.changed?.(newDoc._id, fields);
				}
			}
			startOfGroup = endOfGroup + 1;
		});
	}

	// General helper for diff-ing two objects.
	// callbacks is an object like so:
	// { leftOnly: function (key, leftValue) {...},
	//   rightOnly: function (key, rightValue) {...},
	//   both: function (key, leftValue, rightValue) {...},
	// }
	private static diffObjects<TLeft, TRight>(
		left: Record<string, TLeft>,
		right: Record<string, TRight>,
		callbacks: {
			leftOnly?: (key: string, leftValue: TLeft) => void;
			rightOnly?: (key: string, rightValue: TRight) => void;
			both?: (key: string, leftValue: TLeft, rightValue: TRight) => void;
		},
	): void {
		Object.keys(left).forEach((key) => {
			const leftValue = left[key];
			if (hasOwn.call(right, key)) {
				callbacks.both?.(key, leftValue, right[key]);
			} else {
				callbacks.leftOnly?.(key, leftValue);
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
	}

	static makeChangedFields<TLeft, TRight>(
		newDoc: Record<string, TRight>,
		oldDoc: Record<string, TLeft>,
	): Record<string, TRight | undefined> {
		const fields: Record<string, TRight | undefined> = {};
		DiffSequence.diffObjects<TLeft, TRight>(oldDoc, newDoc, {
			leftOnly(key) {
				fields[key] = undefined;
			},
			rightOnly(key, value) {
				fields[key] = value;
			},
			both(key, leftValue, rightValue) {
				if (!isEqual(leftValue as any, rightValue as any)) fields[key] = rightValue;
			},
		});
		return fields;
	}

	static applyChanges(doc: Record<string, any>, changeFields: Record<string, any>): void {
		Object.keys(changeFields).forEach((key) => {
			const value = changeFields[key];
			if (typeof value === 'undefined') {
				delete doc[key];
			} else {
				doc[key] = value;
			}
		});
	}
}
