import { EJSON } from 'meteor/ejson';

import type { IdMap } from './IdMap';
import { hasOwn } from './common';

function isObjEmpty(obj: Record<string, any>): boolean {
	for (const key in Object(obj)) {
		if (hasOwn.call(obj, key)) {
			return false;
		}
	}
	return true;
}

type Observer = {
	added?: (id: any, fields: any) => void;
	changed?: (id: any, fields: any) => void;
	removed?: (id: any) => void;
	movedBefore?: (id: any, before: any | null) => void;
	addedBefore?: (id: any, fields: any, before: any | null) => void;
};

export class DiffSequence {
	// ordered: bool.
	// old_results and new_results: collections of documents.
	//    if ordered, they are arrays.
	//    if unordered, they are IdMaps
	static diffQueryChanges(
		ordered: true,
		oldResults: any[],
		newResults: any[],
		observer: Observer,
		options?: { projectionFn?: (doc: any) => any },
	): void;

	static diffQueryChanges(
		ordered: false,
		oldResults: IdMap<any>,
		newResults: IdMap<any>,
		observer: Observer,
		options?: { projectionFn?: (doc: any) => any },
	): void;

	static diffQueryChanges(
		ordered: boolean,
		oldResults: any[] | IdMap<any>,
		newResults: any[] | IdMap<any>,
		observer: Observer,
		options?: { projectionFn?: (doc: any) => any },
	): void {
		if (ordered) DiffSequence.diffQueryOrderedChanges(oldResults as any[], newResults as any[], observer, options);
		else DiffSequence.diffQueryUnorderedChanges(oldResults as IdMap<any>, newResults as IdMap<any>, observer, options);
	}

	static diffQueryUnorderedChanges(
		oldResults: IdMap<any>,
		newResults: IdMap<any>,
		observer: Observer,
		options?: { projectionFn?: (doc: any) => any },
	): void {
		options = options || {};
		const projectionFn = options.projectionFn || EJSON.clone;

		if (observer.movedBefore) {
			throw new Error('_diffQueryUnordered called with a movedBefore observer!');
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
				if (!newResults.has(id)) observer.removed!(id);
			});
		}
	}

	static diffQueryOrderedChanges(
		oldResults: any[],
		newResults: any[],
		observer: Observer,
		options?: { projectionFn?: (doc: any) => any },
	): void {
		options = options || {};
		const projectionFn = options.projectionFn || EJSON.clone;

		const newPresenceOfId: Record<string, boolean> = {};
		newResults.forEach((doc) => {
			if (newPresenceOfId[doc._id]) Meteor._debug('Duplicate _id in new_results');
			newPresenceOfId[doc._id] = true;
		});

		const oldIndexOfId: Record<string, number> = {};
		oldResults.forEach((doc, i) => {
			if (doc._id in oldIndexOfId) Meteor._debug('Duplicate _id in old_results');
			oldIndexOfId[doc._id] = i;
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
			return oldIndexOfId[newResults[iNew]._id];
		};
		// for each item in new_results, use it to extend a common subsequence
		// of length j <= max_seq_len
		for (let i = 0; i < N; i++) {
			if (oldIndexOfId[newResults[i]._id] !== undefined) {
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
			if (!newPresenceOfId[doc._id]) observer.removed?.(doc._id);
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
					fields = projectionFn(newDoc);
					delete fields._id;
					observer.addedBefore && observer.addedBefore(newDoc._id, fields, groupId);
					observer.added?.(newDoc._id, fields);
				} else {
					// moved
					oldDoc = oldResults[oldIndexOfId[newDoc._id]];
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
				oldDoc = oldResults[oldIndexOfId[newDoc._id]];
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
	static diffObjects(
		left: Record<string, any>,
		right: Record<string, any>,
		callbacks: {
			leftOnly?: (key: string, leftValue: any) => void;
			rightOnly?: (key: string, rightValue: any) => void;
			both?: (key: string, leftValue: any, rightValue: any) => void;
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

	static diffMaps(
		left: Map<string, any>,
		right: Map<string, any>,
		callbacks: {
			leftOnly?: (key: string, leftValue: any) => void;
			rightOnly?: (key: string, rightValue: any) => void;
			both?: (key: string, leftValue: any, rightValue: any) => void;
		},
	): void {
		left.forEach((leftValue, key) => {
			if (right.has(key)) {
				callbacks.both?.(key, leftValue, right.get(key));
			} else {
				callbacks.leftOnly?.(key, leftValue);
			}
		});

		if (callbacks.rightOnly) {
			right.forEach((rightValue, key) => {
				if (!left.has(key)) {
					callbacks.rightOnly!(key, rightValue);
				}
			});
		}
	}

	static makeChangedFields(newDoc: Record<string, any>, oldDoc: Record<string, any>): Record<string, any> {
		const fields: Record<string, any> = {};
		DiffSequence.diffObjects(oldDoc, newDoc, {
			leftOnly(key) {
				fields[key] = undefined;
			},
			rightOnly(key, value) {
				fields[key] = value;
			},
			both(key, leftValue, rightValue) {
				if (!EJSON.equals(leftValue, rightValue)) fields[key] = rightValue;
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
