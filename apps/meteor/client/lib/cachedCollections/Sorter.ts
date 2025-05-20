import type { Filter, Sort } from 'mongodb';

import { Matcher } from './Matcher';
import { _f, expandArraysInBranches, hasOwn, makeLookupFunction } from './common';

/** @deprecated internal use only */
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

		if (this._sortFunction) {
			return;
		}

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

	_compareKeys(key1: string[], key2: string[]): number {
		if (key1.length !== this._sortSpecParts.length || key2.length !== this._sortSpecParts.length) {
			throw Error('Key has wrong length');
		}

		return this._keyComparator(key1, key2);
	}

	_generateKeysFromDoc(doc: T, cb: (key: string[]) => void): void {
		if (this._sortSpecParts.length === 0) {
			throw new Error("can't generate keys without a spec");
		}

		const pathFromIndices = (indices: (number | string)[]) => `${indices.join(',')},`;

		let knownPaths: Record<string, boolean> | null = null;

		const valuesByIndexAndPath = this._sortSpecParts.map((spec) => {
			let branches = expandArraysInBranches(spec.lookup(doc), true);

			if (!branches.length) {
				branches = [{ value: void 0 }];
			}

			const element = Object.create(null);
			let usedPaths = false;

			branches.forEach((branch) => {
				if (!branch.arrayIndices) {
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

				if (knownPaths && !hasOwn.call(knownPaths, path)) {
					throw Error('cannot index parallel arrays');
				}
			});

			if (knownPaths) {
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

	_keyFieldComparator(i: number): (key1: string[], key2: string[]) => number {
		const invert = !this._sortSpecParts[i].ascending;

		return (key1, key2) => {
			const compare = _f._cmp(key1[i], key2[i]);
			return invert ? -compare : compare;
		};
	}
}

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
