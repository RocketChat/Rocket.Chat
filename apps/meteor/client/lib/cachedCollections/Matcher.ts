import type { Filter } from '@rocket.chat/mongo-adapter';

import { _selectorIsId, compileDocumentSelector, hasOwn, isBinary, isEqual, nothingMatcher } from './common';

/** @deprecated internal use only */
export class Matcher<T extends { _id: string }> {
	private readonly _paths: Record<string, boolean>;

	_hasWhere: boolean;

	_isSimple: boolean;

	private readonly _docMatcher: (doc: T) => { result: boolean; arrayIndices?: (number | 'x')[] };

	constructor(selector: Filter<T> | T['_id'] | ((this: T) => boolean)) {
		this._paths = {};
		this._hasWhere = false;
		this._isSimple = true;
		this._docMatcher = this._compileSelector(selector);
	}

	documentMatches(doc: T) {
		if (doc !== Object(doc)) {
			throw Error('documentMatches needs a document');
		}

		return this._docMatcher(doc);
	}

	private _compileSelector(
		selector: ((this: T) => boolean) | string | { _id: undefined | null | false } | Record<string, unknown>,
	): (doc: T) => { result: boolean } {
		if (typeof selector === 'function') {
			this._isSimple = false;
			this._recordPathUsed('');

			return (doc) => ({ result: !!selector.call(doc) });
		}

		if (_selectorIsId(selector)) {
			this._recordPathUsed('_id');

			return (doc) => ({ result: isEqual(doc._id, selector) });
		}

		if (!selector || ('_id' in selector && hasOwn.call(selector, '_id') && !selector._id)) {
			this._isSimple = false;
			return nothingMatcher;
		}

		if (Array.isArray(selector) || isBinary(selector) || typeof selector === 'boolean') {
			throw new Error(`Invalid selector: ${selector}`);
		}

		return compileDocumentSelector(selector, this);
	}

	_recordPathUsed(path: string): void {
		this._paths[path] = true;
	}
}
