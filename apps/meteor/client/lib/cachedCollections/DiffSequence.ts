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

/** @deprecated internal use only */
export class DiffSequence {
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
				if (!newResults.has(id)) observer.removed?.(id);
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

		const unmoved: number[] = [];

		let maxSeqLen = 0;

		const N = newResults.length;
		const seqEnds = new Array(N);

		const ptrs = new Array(N);

		const oldIdxSeq = function (iNew: number): number {
			return oldIndexOfId.get(newResults[iNew]._id)!;
		};
		for (let i = 0; i < N; i++) {
			if (oldIndexOfId.get(newResults[i]._id) !== undefined) {
				let j = maxSeqLen;
				while (j > 0) {
					if (oldIdxSeq(seqEnds[j - 1]) < oldIdxSeq(i)) break;
					j--;
				}

				ptrs[i] = j === 0 ? -1 : seqEnds[j - 1];
				seqEnds[j] = i;
				if (j + 1 > maxSeqLen) maxSeqLen = j + 1;
			}
		}

		let idx = maxSeqLen === 0 ? -1 : seqEnds[maxSeqLen - 1];
		while (idx >= 0) {
			unmoved.push(idx);
			idx = ptrs[idx];
		}
		unmoved.reverse();

		unmoved.push(newResults.length);

		oldResults.forEach((doc) => {
			if (!newPresenceOfId.has(doc._id)) observer.removed?.(doc._id);
		});

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
					observer.addedBefore?.(newDoc._id, fields, groupId);
					observer.added?.(newDoc._id, fields);
				} else {
					oldDoc = oldResults[oldIndexOfId.get(newDoc._id)!];
					projectedNew = projectionFn(newDoc);
					projectedOld = projectionFn(oldDoc);
					fields = DiffSequence.makeChangedFields(projectedNew, projectedOld);
					if (!isObjEmpty(fields)) {
						observer.changed?.(newDoc._id, fields);
					}
					observer.movedBefore?.(newDoc._id, groupId);
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
					callbacks.rightOnly?.(key, rightValue);
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
