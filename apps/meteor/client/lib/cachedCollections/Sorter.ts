import type { Filter, Sort } from 'mongodb';

import { Matcher } from './Matcher';
import { _f, expandArraysInBranches, hasOwn, makeLookupFunction } from './common';

// Give a sort spec, which can be in any of these forms:
//   {"key1": 1, "key2": -1}
//   [["key1", "asc"], ["key2", "desc"]]
//   ["key1", ["key2", "desc"]]
//
// (.. with the first form being dependent on the key enumeration
// behavior of your javascript VM, which usually does what you mean in
// this case if the key names don't look like integers ..)
//
// return a function that takes two objects, and returns -1 if the
// first object comes first in order, 1 if the second object comes
// first, or 0 if neither object comes before the other.

export class Sorter<T extends { _id: string }> {
	_sortSpecParts: Array<{
		ascending: boolean;
		lookup: (
			doc: T,
			arrayIndices?: (number | 'x')[],
		) => {
			value: unknown;
			dontIterate?: boolean;
			arrayIndices?: (number | 'x')[];
		}[];
		path: string;
	}>;

	_sortFunction: ((a: T, b: T) => number) | null;

	_keyComparator: (key1: string[], key2: string[]) => number;

	_selectorForAffectedByModifier?: Matcher<T>;

	affectedByModifier: boolean;

	constructor(spec: Sort) {
		this._sortSpecParts = [];
		this._sortFunction = null;

		const addSpecPart = (path: string, ascending: boolean) => {
			if (!path) {
				throw Error('sort keys must be non-empty');
			}

			if (path.charAt(0) === '$') {
				throw Error(`unsupported sort key: ${path}`);
			}

			this._sortSpecParts.push({
				ascending,
				lookup: makeLookupFunction(path, { forSort: true }),
				path,
			});
		};

		if (Array.isArray(spec)) {
			spec.forEach((element) => {
				if (typeof element === 'string') {
					addSpecPart(element, true);
				} else {
					addSpecPart((element as [string, string])[0], (element as [string, string])[1] !== 'desc');
				}
			});
		} else if (typeof spec === 'object') {
			Object.keys(spec).forEach((key) => {
				addSpecPart(key, (spec as Record<string, number>)[key] >= 0);
			});
		} else if (typeof spec === 'function') {
			this._sortFunction = spec;
		} else {
			throw Error(`Bad sort specification: ${JSON.stringify(spec)}`);
		}

		// If a function is specified for sorting, we skip the rest.
		if (this._sortFunction) {
			return;
		}

		// To implement affectedByModifier, we piggy-back on top of Matcher's
		// affectedByModifier code; we create a selector that is affected by the
		// same modifiers as this sort order. This is only implemented on the
		// server.
		if (this.affectedByModifier) {
			const selector: Filter<T> = {};

			this._sortSpecParts.forEach((spec) => {
				selector[spec.path as keyof Filter<T>] = 1;
			});

			this._selectorForAffectedByModifier = new Matcher(selector);
		}

		this._keyComparator = composeComparators(this._sortSpecParts.map((_spec, i) => this._keyFieldComparator(i)));
	}

	getComparator(): (a: T, b: T) => number {
		return this._getBaseComparator();
	}

	// Takes in two keys: arrays whose lengths match the number of spec
	// parts. Returns negative, 0, or positive based on using the sort spec to
	// compare fields.
	_compareKeys(key1: string[], key2: string[]): number {
		if (key1.length !== this._sortSpecParts.length || key2.length !== this._sortSpecParts.length) {
			throw Error('Key has wrong length');
		}

		return this._keyComparator(key1, key2);
	}

	// Iterates over each possible "key" from doc (ie, over each branch), calling
	// 'cb' with the key.
	_generateKeysFromDoc(doc: T, cb: (key: string[]) => void): void {
		if (this._sortSpecParts.length === 0) {
			throw new Error("can't generate keys without a spec");
		}

		const pathFromIndices = (indices: (number | string)[]) => `${indices.join(',')},`;

		let knownPaths: Record<string, boolean> | null = null;

		// maps index -> ({'' -> value} or {path -> value})
		const valuesByIndexAndPath = this._sortSpecParts.map((spec) => {
			// Expand any leaf arrays that we find, and ignore those arrays
			// themselves.  (We never sort based on an array itself.)
			let branches = expandArraysInBranches(spec.lookup(doc), true);

			// If there are no values for a key (eg, key goes to an empty array),
			// pretend we found one undefined value.
			if (!branches.length) {
				branches = [{ value: void 0 }];
			}

			const element = Object.create(null);
			let usedPaths = false;

			branches.forEach((branch) => {
				if (!branch.arrayIndices) {
					// If there are no array indices for a branch, then it must be the
					// only branch, because the only thing that produces multiple branches
					// is the use of arrays.
					if (branches.length > 1) {
						throw Error('multiple branches but no array used?');
					}

					element[''] = branch.value;
					return;
				}

				usedPaths = true;

				const path = pathFromIndices(branch.arrayIndices);

				if (hasOwn.call(element, path)) {
					throw Error(`duplicate path: ${path}`);
				}

				element[path] = branch.value;

				// If two sort fields both go into arrays, they have to go into the
				// exact same arrays and we have to find the same paths.  This is
				// roughly the same condition that makes MongoDB throw this strange
				// error message.  eg, the main thing is that if sort spec is {a: 1,
				// b:1} then a and b cannot both be arrays.
				//
				// (In MongoDB it seems to be OK to have {a: 1, 'a.x.y': 1} where 'a'
				// and 'a.x.y' are both arrays, but we don't allow this for now.
				// #NestedArraySort
				// XXX achieve full compatibility here
				if (knownPaths && !hasOwn.call(knownPaths, path)) {
					throw Error('cannot index parallel arrays');
				}
			});

			if (knownPaths) {
				// Similarly to above, paths must match everywhere, unless this is a
				// non-array field.
				if (!hasOwn.call(element, '') && Object.keys(knownPaths).length !== Object.keys(element).length) {
					throw Error('cannot index parallel arrays!');
				}
			} else if (usedPaths) {
				knownPaths = {};

				Object.keys(element).forEach((path) => {
					knownPaths![path] = true;
				});
			}

			return element;
		});

		if (!knownPaths) {
			// Easy case: no use of arrays.
			const soleKey = valuesByIndexAndPath.map((values) => {
				if (!hasOwn.call(values, '')) {
					throw Error('no value in sole key case?');
				}

				return values[''];
			});

			cb(soleKey);

			return;
		}

		Object.keys(knownPaths).forEach((path) => {
			const key = valuesByIndexAndPath.map((values) => {
				if (hasOwn.call(values, '')) {
					return values[''];
				}

				if (!hasOwn.call(values, path)) {
					throw Error('missing path?');
				}

				return values[path];
			});

			cb(key);
		});
	}

	// Returns a comparator that represents the sort specification.
	_getBaseComparator(): (a: T, b: T) => number {
		if (this._sortFunction) {
			return this._sortFunction;
		}

		if (!this._sortSpecParts.length) {
			return (_doc1: T, _doc2: T) => 0;
		}

		return (doc1, doc2) => {
			const key1 = this._getMinKeyFromDoc(doc1);
			const key2 = this._getMinKeyFromDoc(doc2);
			return this._compareKeys(key1, key2);
		};
	}

	// Finds the minimum key from the doc, according to the sort specs.  (We say
	// "minimum" here but this is with respect to the sort spec, so "descending"
	// sort fields mean we're finding the max for that field.)
	//
	// Note that this is NOT "find the minimum value of the first field, the
	// minimum value of the second field, etc"... it's "choose the
	// lexicographically minimum value of the key vector, allowing only keys which
	// you can find along the same paths".  ie, for a doc {a: [{x: 0, y: 5}, {x:
	// 1, y: 3}]} with sort spec {'a.x': 1, 'a.y': 1}, the only keys are [0,5] and
	// [1,3], and the minimum key is [0,5]; notably, [0,3] is NOT a key.
	_getMinKeyFromDoc(doc: T): string[] {
		let minKey: string[] | null = null;

		this._generateKeysFromDoc(doc, (key) => {
			if (minKey === null) {
				minKey = key;
				return;
			}

			if (this._compareKeys(key, minKey) < 0) {
				minKey = key;
			}
		});

		return minKey as unknown as string[];
	}

	_getPaths(): string[] {
		return this._sortSpecParts.map((part) => part.path);
	}

	// Given an index 'i', returns a comparator that compares two key arrays based
	// on field 'i'.
	_keyFieldComparator(i: number): (key1: string[], key2: string[]) => number {
		const invert = !this._sortSpecParts[i].ascending;

		return (key1, key2) => {
			const compare = _f._cmp(key1[i], key2[i]);
			return invert ? -compare : compare;
		};
	}
}

// Given an array of comparators
// (functions (a,b)->(negative or positive or zero)), returns a single
// comparator which uses each comparator in order and returns the first
// non-zero value.
function composeComparators<T>(comparatorArray: Array<(a: T, b: T) => number>): (a: T, b: T) => number {
	return (a, b) => {
		for (let i = 0; i < comparatorArray.length; ++i) {
			const compare = comparatorArray[i](a, b);
			if (compare !== 0) {
				return compare;
			}
		}

		return 0;
	};
}
