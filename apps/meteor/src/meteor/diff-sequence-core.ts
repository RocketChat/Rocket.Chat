import { EJSON } from './ejson.ts';
import { isEmptyObject } from './utils/isEmptyObject.ts';

export type DocWithId = {
	_id: string;
	[key: string]: unknown;
};

export type DiffCallbacks<K, V> = {
	both?: (key: K, leftValue: V, rightValue: V) => void;
	leftOnly?: (key: K, value: V) => void;
	rightOnly?: (key: K, value: V) => void;
};

export type UnorderedObserver<T> = {
	added?: (id: string, fields: Partial<T>) => void;
	changed?: (id: string, fields: Partial<T>) => void;
	removed?: (id: string) => void;
	movedBefore?: never;
};

export type OrderedObserver<T> = {
	added?: (id: string, fields: Partial<T>) => void;
	addedBefore?: (id: string, fields: Partial<T>, before: string | null) => void;
	changed?: (id: string, fields: Partial<T>) => void;
	movedBefore?: (id: string, before: string | null) => void;
	removed?: (id: string) => void;
};

export const diffObjects = <TDoc extends Record<string, unknown>>(
	left: TDoc,
	right: TDoc,
	callbacks: DiffCallbacks<keyof TDoc, TDoc[keyof TDoc]>,
) => {
	for (const key of Object.keys(left) as Array<keyof TDoc>) {
		const leftValue = left[key];

		if (Object.hasOwn(right, key as string)) {
			callbacks.both?.(key, leftValue, right[key]);
		} else {
			callbacks.leftOnly?.(key, leftValue);
		}
	}

	if (callbacks.rightOnly) {
		for (const key of Object.keys(right) as Array<keyof TDoc>) {
			if (!Object.hasOwn(left, key as string)) {
				callbacks.rightOnly(key, right[key]);
			}
		}
	}
};

export const diffMaps = <K, V>(left: Map<K, V>, right: Map<K, V>, callbacks: DiffCallbacks<K, V>) => {
	for (const [key, leftValue] of left) {
		const rightValue = right.get(key);

		if (rightValue !== undefined) {
			callbacks.both?.(key, leftValue, rightValue);
		} else {
			callbacks.leftOnly?.(key, leftValue);
		}
	}

	if (callbacks.rightOnly) {
		for (const [key, rightValue] of right) {
			if (!left.has(key)) {
				callbacks.rightOnly(key, rightValue);
			}
		}
	}
};

export const makeChangedFields = <TDoc extends Record<string, unknown>>(newDoc: TDoc, oldDoc: TDoc): Partial<TDoc> => {
	const fields: Partial<TDoc> = {};

	diffObjects(oldDoc, newDoc, {
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
		},
	});

	return fields;
};

export const diffQueryUnorderedChanges = <T extends DocWithId>(
	oldResults: Map<string, T>,
	newResults: Map<string, T>,
	observer: UnorderedObserver<T>,
	{ projectionFn = EJSON.clone }: { projectionFn?: (doc: T) => Partial<T> } = {},
) => {
	if ('movedBefore' in observer && observer.movedBefore) {
		throw new Error('_diffQueryUnordered called with a movedBefore observer!');
	}

	for (const [id, newDoc] of newResults) {
		const oldDoc = oldResults.get(id);

		if (oldDoc) {
			if (observer.changed && !EJSON.equals(oldDoc, newDoc)) {
				const changedFields = makeChangedFields(projectionFn(newDoc), projectionFn(oldDoc));

				if (!isEmptyObject(changedFields)) observer.changed(id, changedFields);
			}
		} else if (observer.added) {
			const fields = projectionFn(newDoc);
			delete fields._id;
			observer.added(id, fields);
		}
	}

	if (observer.removed) {
		for (const id of oldResults.keys()) {
			if (!newResults.has(id)) observer.removed(id);
		}
	}
};

export const diffQueryOrderedChanges = <T extends DocWithId>(
	oldResults: T[],
	newResults: T[],
	observer: OrderedObserver<T>,
	{ projectionFn = EJSON.clone }: { projectionFn?: (doc: T) => Partial<T> } = {},
) => {
	const newPresenceOfId = new Set<string>();
	for (const doc of newResults) {
		if (newPresenceOfId.has(doc._id)) console.debug('Duplicate _id in newResults');
		newPresenceOfId.add(doc._id);
	}

	const oldIndexOfId = new Map<string, number>();
	oldResults.forEach((doc, i) => {
		if (oldIndexOfId.has(doc._id)) console.debug('Duplicate _id in oldResults');
		oldIndexOfId.set(doc._id, i);
	});

	const unmoved: number[] = [];
	let maxSeqLen = 0;
	const N = newResults.length;
	const seqEnds = new Array(N);
	const ptrs = new Array(N);

	for (let i = 0; i < N; i++) {
		const currentOldIdx = oldIndexOfId.get(newResults[i]._id);
		if (currentOldIdx !== undefined) {
			let j = maxSeqLen;

			while (j > 0) {
				const prevOldIdx = oldIndexOfId.get(newResults[seqEnds[j - 1]]._id);
				if (prevOldIdx !== undefined && prevOldIdx < currentOldIdx) {
					break;
				}
				j--;
			}

			ptrs[i] = j === 0 ? -1 : seqEnds[j - 1];
			seqEnds[j] = i;

			if (j + 1 > maxSeqLen) {
				maxSeqLen = j + 1;
			}
		}
	}

	let idx = maxSeqLen === 0 ? -1 : seqEnds[maxSeqLen - 1];
	while (idx >= 0) {
		unmoved.push(idx);
		idx = ptrs[idx];
	}

	unmoved.reverse();
	unmoved.push(newResults.length);

	if (observer.removed) {
		for (const doc of oldResults) {
			if (!newPresenceOfId.has(doc._id)) observer.removed(doc._id);
		}
	}

	let startOfGroup = 0;

	for (const endOfGroup of unmoved) {
		const groupId = newResults[endOfGroup]?._id ?? null;

		for (let i = startOfGroup; i < endOfGroup; i++) {
			const newDoc = newResults[i];

			const oldIndex = oldIndexOfId.get(newDoc._id);

			if (oldIndex === undefined) {
				const fields = projectionFn(newDoc);
				delete fields._id;

				if (observer.addedBefore) observer.addedBefore(newDoc._id, fields, groupId);
				else observer.added?.(newDoc._id, fields);
			} else {
				const oldDoc = oldResults[oldIndex];
				const fields = makeChangedFields(projectionFn(newDoc), projectionFn(oldDoc));

				if (!isEmptyObject(fields)) observer.changed?.(newDoc._id, fields);
				observer.movedBefore?.(newDoc._id, groupId);
			}
		}

		if (groupId) {
			const newDoc = newResults[endOfGroup];
			const oldIndex = oldIndexOfId.get(newDoc._id);

			if (oldIndex !== undefined) {
				const oldDoc = oldResults[oldIndex];
				const fields = makeChangedFields(projectionFn(newDoc), projectionFn(oldDoc));

				if (!isEmptyObject(fields)) observer.changed?.(newDoc._id, fields);
			}
		}

		startOfGroup = endOfGroup + 1;
	}
};

type DiffQueryArgs<T extends DocWithId> =
	| [ordered: true, oldResults: T[], newResults: T[], observer: OrderedObserver<T>, options?: { projectionFn?: (doc: T) => Partial<T> }]
	| [
			ordered: false | undefined,
			oldResults: Map<string, T>,
			newResults: Map<string, T>,
			observer: UnorderedObserver<T>,
			options?: { projectionFn?: (doc: T) => Partial<T> },
	  ];

export const diffQueryChanges = <T extends DocWithId>(...[ordered, oldResults, newResults, observer, options]: DiffQueryArgs<T>) =>
	ordered
		? diffQueryOrderedChanges(oldResults, newResults, observer, options)
		: diffQueryUnorderedChanges(oldResults, newResults, observer, options);

export const applyChanges = <T extends Record<string, unknown>>(doc: T, changeFields: Partial<T>) => {
	for (const [key, value] of Object.entries(changeFields)) {
		if (value === undefined) {
			delete doc[key];
		} else {
			doc[key as keyof T] = value as T[keyof T];
		}
	}
};
