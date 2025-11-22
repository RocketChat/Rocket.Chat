import type { IdMap } from './IdMap';
import { clone, hasOwn, equals } from './common';
import type { Observer, OrderedObserver, UnorderedObserver } from './observers';
import { entriesOf } from '../../lib/objectUtils';

function isObjEmpty(obj: Record<string, unknown>): boolean {
	for (const key in Object(obj)) {
		if (hasOwn.call(obj, key)) {
			return false;
		}
	}
	return true;
}

export class DiffSequence {
	static diffQueryChanges<T extends { _id: string }>(
		ordered: true,
		oldResults: T[],
		newResults: T[],
		observer: OrderedObserver<T>,
		options?: { projectionFn?: (doc: T | Omit<T, '_id'>) => Partial<T> },
	): void;

	static diffQueryChanges<T extends { _id: string }>(
		ordered: false,
		oldResults: IdMap<T['_id'], T>,
		newResults: IdMap<T['_id'], T>,
		observer: UnorderedObserver<T>,
		options?: { projectionFn?: (doc: T | Omit<T, '_id'>) => Partial<T> },
	): void;

	static diffQueryChanges<T extends { _id: string }>(
		ordered: boolean,
		oldResults: T[] | IdMap<T['_id'], T>,
		newResults: T[] | IdMap<T['_id'], T>,
		observer: Observer<T>,
		options?: { projectionFn?: (doc: T | Omit<T, '_id'>) => Partial<T> },
	): void;

	static diffQueryChanges<T extends { _id: string }>(
		ordered: boolean,
		oldResults: T[] | IdMap<T['_id'], T>,
		newResults: T[] | IdMap<T['_id'], T>,
		observer: Observer<T>,
		options?: { projectionFn?: (doc: T | Omit<T, '_id'>) => Partial<T> },
	): void {
		if (ordered) DiffSequence.diffQueryOrderedChanges(oldResults as T[], newResults as T[], observer as OrderedObserver<T>, options);
		else
			DiffSequence.diffQueryUnorderedChanges(
				oldResults as IdMap<T['_id'], T>,
				newResults as IdMap<T['_id'], T>,
				observer as UnorderedObserver<T>,
				options,
			);
	}

	private static diffQueryUnorderedChanges<T extends { _id: string }>(
		oldResults: IdMap<T['_id'], T>,
		newResults: IdMap<T['_id'], T>,
		observer: UnorderedObserver<T>,
		options?: { projectionFn?: (doc: T | Omit<T, '_id'>) => Partial<T> },
	): void {
		options = options || {};
		const projectionFn = options.projectionFn || clone;

		newResults.forEach((newDoc, id) => {
			const oldDoc = oldResults.get(id);
			if (oldDoc) {
				if (observer.changed && !equals(oldDoc, newDoc as any)) {
					const projectedNew = projectionFn(newDoc);
					const projectedOld = projectionFn(oldDoc);
					const changedFields = DiffSequence.makeChangedFields(projectedNew, projectedOld);
					if (!isObjEmpty(changedFields)) {
						observer.changed(id, changedFields as Partial<T>);
					}
				}
			} else if (observer.added) {
				const fields = projectionFn(newDoc) as Omit<Partial<T>, '_id'> & { _id?: string };
				delete fields._id;
				observer.added(newDoc._id, fields as Partial<T>);
			}
		});

		if (observer.removed) {
			oldResults.forEach((_oldDoc, id) => {
				if (!newResults.has(id)) observer.removed?.(id);
			});
		}
	}

	private static diffQueryOrderedChanges<T extends { _id: string }>(
		oldResults: T[],
		newResults: T[],
		observer: OrderedObserver<T>,
		options?: { projectionFn?: (doc: T | Omit<T, '_id'>) => Partial<T> },
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
					fields = projectionFn(newDoc) as Omit<Partial<T>, '_id'> & { _id?: string };
					delete fields._id;
					if ('addedBefore' in observer) observer.addedBefore?.(newDoc._id, fields as Partial<T>, groupId);
					observer.added?.(newDoc._id, fields as Partial<T>);
				} else {
					oldDoc = oldResults[oldIndexOfId.get(newDoc._id)!];
					projectedNew = projectionFn(newDoc);
					projectedOld = projectionFn(oldDoc);
					fields = DiffSequence.makeChangedFields(projectedNew, projectedOld);
					if (!isObjEmpty(fields)) {
						observer.changed?.(newDoc._id, fields);
					}
					if ('movedBefore' in observer) observer.movedBefore?.(newDoc._id, groupId);
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

	private static diffObjects<T extends object>(
		left: T,
		right: T,
		callbacks: {
			leftOnly?: (key: keyof T, leftValue: T[keyof T]) => void;
			rightOnly?: (key: keyof T, rightValue: T[keyof T]) => void;
			both?: (key: keyof T, leftValue: T[keyof T], rightValue: T[keyof T]) => void;
		},
	): void {
		entriesOf(left).forEach(([key, leftValue]) => {
			if (key in right) {
				callbacks.both?.(key, leftValue, right[key]);
			} else {
				callbacks.leftOnly?.(key, leftValue);
			}
		});

		if (callbacks.rightOnly) {
			entriesOf(right).forEach(([key, rightValue]) => {
				if (!(key in left)) {
					callbacks.rightOnly?.(key, rightValue);
				}
			});
		}
	}

	static makeChangedFields<T extends object>(newDoc: T, oldDoc: T): Partial<T> {
		const fields: Partial<T> = {};
		DiffSequence.diffObjects(oldDoc, newDoc, {
			leftOnly(key) {
				fields[key] = undefined;
			},
			rightOnly(key, value) {
				fields[key] = value;
			},
			both(key, leftValue, rightValue) {
				if (!equals(leftValue, rightValue)) fields[key] = rightValue;
			},
		});
		return fields;
	}

	static applyChanges<T extends object>(doc: T, changeFields: T): void {
		entriesOf(changeFields).forEach(([key, value]) => {
			if (typeof value === 'undefined') {
				delete doc[key];
			} else {
				doc[key] = value;
			}
		});
	}
}
