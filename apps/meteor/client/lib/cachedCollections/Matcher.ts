import type { Filter } from 'mongodb';

import { _selectorIsId, compileDocumentSelector, hasOwn, isBinary, isEqual, nothingMatcher } from './common';

// The minimongo selector compiler!

// Terminology:
//  - a 'selector' is the EJSON object representing a selector
//  - a 'matcher' is its compiled form (whether a full Minimongo.Matcher
//    object or one of the component lambdas that matches parts of it)
//  - a 'result object' is an object with a 'result' field and maybe
//    arrayIndices.
//  - a 'branched value' is an object with a 'value' field and maybe
//    'dontIterate' and 'arrayIndices'.
//  - a 'document' is a top-level object that can be stored in a collection.
//  - a 'lookup function' is a function that takes in a document and returns
//    an array of 'branched values'.
//  - a 'branched matcher' maps from an array of branched values to a result
//    object.
//  - an 'element matcher' maps from a single value to a bool.

// Main entry point.
//   var matcher = new Minimongo.Matcher({a: {$gt: 5}});
//   if (matcher.documentMatches({a: 7})) ...
export class Matcher<T extends { _id: string }> {
	private _paths: Record<string, boolean>;

	_hasWhere: boolean;

	_isSimple: boolean;

	private _docMatcher: (doc: T) => { result: boolean; arrayIndices?: (number | 'x')[] };

	constructor(selector: Filter<T> | T['_id'] | ((this: T) => boolean)) {
		// A set (object mapping string -> *) of all of the document paths looked
		// at by the selector. Also includes the empty string if it may look at any
		// path (eg, $where).
		this._paths = {};
		// Set to true if compilation finds a $where.
		this._hasWhere = false;
		// Set to false if compilation finds anything other than a simple equality
		// or one or more of '$gt', '$gte', '$lt', '$lte', '$ne', '$in', '$nin' used
		// with scalars as operands.
		this._isSimple = true;
		this._docMatcher = this._compileSelector(selector);
	}

	documentMatches(doc: T) {
		if (doc !== Object(doc)) {
			throw Error('documentMatches needs a document');
		}

		return this._docMatcher(doc);
	}

	hasWhere(): boolean {
		return this._hasWhere;
	}

	isSimple(): boolean {
		return this._isSimple;
	}

	// Given a selector, return a function that takes one argument, a
	// document. It returns a result object.
	_compileSelector(
		selector: ((this: T) => boolean) | string | { _id: undefined | null | false } | Record<string, unknown>,
	): (doc: T) => { result: boolean } {
		// you can pass a literal function instead of a selector
		if (typeof selector === 'function') {
			this._isSimple = false;
			this._recordPathUsed('');

			return (doc) => ({ result: !!selector.call(doc) });
		}

		// shorthand -- scalar _id
		if (_selectorIsId(selector)) {
			this._recordPathUsed('_id');

			return (doc) => ({ result: isEqual(doc._id, selector) });
		}

		// protect against dangerous selectors.  falsey and {_id: falsey} are both
		// likely programmer error, and not what you want, particularly for
		// destructive operations.
		if (!selector || ('_id' in selector && hasOwn.call(selector, '_id') && !selector._id)) {
			this._isSimple = false;
			return nothingMatcher;
		}

		// Top level can't be an array or true or binary.
		if (Array.isArray(selector) || isBinary(selector) || typeof selector === 'boolean') {
			throw new Error(`Invalid selector: ${selector}`);
		}

		return compileDocumentSelector(selector, this);
	}

	// Returns a list of key paths the given selector is looking for. It includes
	// the empty string if there is a $where.
	_getPaths(): string[] {
		return Object.keys(this._paths);
	}

	_recordPathUsed(path: string): void {
		this._paths[path] = true;
	}
}
