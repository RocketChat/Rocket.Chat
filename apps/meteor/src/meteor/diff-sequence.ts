import { EJSON } from './ejson.ts';
import { Meteor } from './meteor.ts';
import { Package } from './package-registry.ts';
import { hasOwn } from './utils/hasOwn.ts';

const isObjEmpty = (obj: any) => {
	for (const key in Object(obj)) {
		if (hasOwn(obj, key)) {
			return false;
		}
	}
	return true;
};

const diffObjects = (
	left: any,
	right: any,
	callbacks: {
		leftOnly?: (key: string, value: any) => void;
		rightOnly?: (key: string, value: any) => void;
		both?: (key: string, leftValue: any, rightValue: any) => void;
	},
) => {
	Object.keys(left).forEach((key) => {
		const leftValue = left[key];

		if (hasOwn(right, key)) {
			if (callbacks.both) {
				callbacks.both(key, leftValue, right[key]);
			}
		} else if (callbacks.leftOnly) {
			callbacks.leftOnly(key, leftValue);
		}
	});

	if (callbacks.rightOnly) {
		const { rightOnly } = callbacks;
		Object.keys(right).forEach((key) => {
			const rightValue = right[key];

			if (!hasOwn(left, key)) {
				rightOnly(key, rightValue);
			}
		});
	}
};

const diffMaps = (
	left: Map<any, any>,
	right: Map<any, any>,
	callbacks: {
		leftOnly?: (key: string, value: any) => void;
		rightOnly?: (key: string, value: any) => void;
		both?: (key: string, leftValue: any, rightValue: any) => void;
	},
) => {
	left.forEach((leftValue, key) => {
		if (right.has(key)) {
			if (callbacks.both) {
				callbacks.both(key, leftValue, right.get(key));
			}
		} else if (callbacks.leftOnly) {
			callbacks.leftOnly(key, leftValue);
		}
	});

	if (callbacks.rightOnly) {
		const { rightOnly } = callbacks;
		right.forEach((rightValue, key) => {
			if (!left.has(key)) {
				rightOnly(key, rightValue);
			}
		});
	}
};

const makeChangedFields = (newDoc: any, oldDoc: any) => {
	const fields: Record<string, any> = {};

	diffObjects(oldDoc, newDoc, {
		leftOnly(key: string) {
			fields[key] = undefined;
		},

		rightOnly(key: string, value: any) {
			fields[key] = value;
		},

		both(key: string, leftValue: any, rightValue: any) {
			if (!EJSON.equals(leftValue, rightValue)) {
				fields[key] = rightValue;
			}
		},
	});

	return fields;
};

const diffQueryUnorderedChanges = (
	oldResults: Map<string, any>,
	newResults: Map<string, any>,
	observer: any,
	options: { projectionFn?: (doc: any) => any } = {},
) => {
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
				const changedFields = makeChangedFields(projectedNew, projectedOld);

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
				observer.removed(id);
			}
		});
	}
};

const diffQueryOrderedChanges = (
	oldResults: any[],
	newResults: any[],
	observer: any,
	options: { projectionFn?: (doc: any) => any } = {},
) => {
	const projectionFn = options.projectionFn || EJSON.clone;
	const newPresenceOfId: Record<string, boolean> = {};

	newResults.forEach((doc) => {
		if (newPresenceOfId[doc._id]) {
			Meteor._debug('Duplicate _id in newResults');
		}
		newPresenceOfId[doc._id] = true;
	});

	const oldIndexOfId: Record<string, number> = {};

	oldResults.forEach((doc, i) => {
		if (doc._id in oldIndexOfId) {
			Meteor._debug('Duplicate _id in oldResults');
		}
		oldIndexOfId[doc._id] = i;
	});

	const unmoved: number[] = [];
	let maxSeqLen = 0;
	const N = newResults.length;
	const seqEnds = new Array(N);
	const ptrs = new Array(N);

	const oldIdxSeq = (iNew: number) => oldIndexOfId[newResults[iNew]._id];

	for (let i = 0; i < N; i++) {
		if (oldIndexOfId[newResults[i]._id] !== undefined) {
			let j = maxSeqLen;

			while (j > 0) {
				if (oldIdxSeq(seqEnds[j - 1]) < oldIdxSeq(i)) {
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

	oldResults.forEach((doc) => {
		if (!newPresenceOfId[doc._id]) {
			if (observer.removed) {
				observer.removed(doc._id);
			}
		}
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

			if (!hasOwn(oldIndexOfId, newDoc._id)) {
				fields = projectionFn(newDoc);
				delete fields._id;
				if (observer.addedBefore) {
					observer.addedBefore(newDoc._id, fields, groupId);
				} else if (observer.added) {
					observer.added(newDoc._id, fields);
				}
			} else {
				oldDoc = oldResults[oldIndexOfId[newDoc._id]];
				projectedNew = projectionFn(newDoc);
				projectedOld = projectionFn(oldDoc);
				fields = makeChangedFields(projectedNew, projectedOld);

				if (!isObjEmpty(fields) && observer.changed) {
					observer.changed(newDoc._id, fields);
				}

				if (observer.movedBefore) {
					observer.movedBefore(newDoc._id, groupId);
				}
			}
		}

		if (groupId) {
			newDoc = newResults[endOfGroup];
			oldDoc = oldResults[oldIndexOfId[newDoc._id]];
			projectedNew = projectionFn(newDoc);
			projectedOld = projectionFn(oldDoc);
			fields = makeChangedFields(projectedNew, projectedOld);

			if (!isObjEmpty(fields) && observer.changed) {
				observer.changed(newDoc._id, fields);
			}
		}

		startOfGroup = endOfGroup + 1;
	});
};

const diffQueryChanges = (
	ordered: boolean,
	oldResults: any,
	newResults: any,
	observer: any,
	options?: { projectionFn?: (doc: any) => any },
) => {
	if (ordered) {
		diffQueryOrderedChanges(oldResults, newResults, observer, options);
	} else {
		diffQueryUnorderedChanges(oldResults, newResults, observer, options);
	}
};

const applyChanges = (doc: any, changeFields: any) => {
	Object.keys(changeFields).forEach((key) => {
		const value = changeFields[key];

		if (typeof value === 'undefined') {
			delete doc[key];
		} else {
			doc[key] = value;
		}
	});
};

const DiffSequence = {
	diffQueryChanges,
	diffQueryUnorderedChanges,
	diffQueryOrderedChanges,
	diffObjects,
	diffMaps,
	makeChangedFields,
	applyChanges,
};

Package['diff-sequence'] = {
	DiffSequence,
};

export { DiffSequence };
