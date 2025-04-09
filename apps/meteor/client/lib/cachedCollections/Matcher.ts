import { EJSON } from 'meteor/ejson';

import { LocalCollection } from './LocalCollection';
import { compileDocumentSelector, hasOwn, nothingMatcher } from './common';

// The minimongo selector compiler!

// Terminology:
//  - a 'selector' is the EJSON object representing a selector
//  - a 'matcher' is its compiled form (whether a full Minimongo.Matcher
//    object or one of the component lambdas that matches parts of it)
//  - a 'result object' is an object with a 'result' field and maybe
//    distance and arrayIndices.
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
export class Matcher {
	_paths: Record<string, boolean>;

	_hasGeoQuery: boolean;

	_hasWhere: boolean;

	_isSimple: boolean;

	_matchingDocument: object | undefined;

	_selector: object | Function | null;

	_docMatcher: (doc: object) => { result: boolean };

	_isUpdate: boolean;

	constructor(selector: object | Function, isUpdate = false) {
		// A set (object mapping string -> *) of all of the document paths looked
		// at by the selector. Also includes the empty string if it may look at any
		// path (eg, $where).
		this._paths = {};
		// Set to true if compilation finds a $near.
		this._hasGeoQuery = false;
		// Set to true if compilation finds a $where.
		this._hasWhere = false;
		// Set to false if compilation finds anything other than a simple equality
		// or one or more of '$gt', '$gte', '$lt', '$lte', '$ne', '$in', '$nin' used
		// with scalars as operands.
		this._isSimple = true;
		// Set to a dummy document which always matches this Matcher. Or set to null
		// if such document is too hard to find.
		this._matchingDocument = undefined;
		// A clone of the original selector. It may just be a function if the user
		// passed in a function; otherwise is definitely an object (eg, IDs are
		// translated into {_id: ID} first. Used by canBecomeTrueByModifier and
		// Sorter._useWithMatcher.
		this._selector = null;
		this._docMatcher = this._compileSelector(selector);
		// Set to true if selection is done for an update operation
		// Default is false
		// Used for $near array update (issue #3599)
		this._isUpdate = isUpdate;
	}

	documentMatches(doc: object): { result: boolean } {
		if (doc !== Object(doc)) {
			throw Error('documentMatches needs a document');
		}

		return this._docMatcher(doc);
	}

	hasGeoQuery(): boolean {
		return this._hasGeoQuery;
	}

	hasWhere(): boolean {
		return this._hasWhere;
	}

	isSimple(): boolean {
		return this._isSimple;
	}

	// Given a selector, return a function that takes one argument, a
	// document. It returns a result object.
	_compileSelector(selector: any): (doc: any) => { result: boolean } {
		// you can pass a literal function instead of a selector
		if (selector instanceof Function) {
			this._isSimple = false;
			this._selector = selector;
			this._recordPathUsed('');

			return (doc) => ({ result: !!selector.call(doc) });
		}

		// shorthand -- scalar _id
		if (LocalCollection._selectorIsId(selector)) {
			this._selector = { _id: selector };
			this._recordPathUsed('_id');

			return (doc: any) => ({ result: EJSON.equals(doc._id, selector as any) });
		}

		// protect against dangerous selectors.  falsey and {_id: falsey} are both
		// likely programmer error, and not what you want, particularly for
		// destructive operations.
		if (!selector || (hasOwn.call(selector, '_id') && !selector._id)) {
			this._isSimple = false;
			return nothingMatcher;
		}

		// Top level can't be an array or true or binary.
		if (Array.isArray(selector) || EJSON.isBinary(selector) || typeof selector === 'boolean') {
			throw new Error(`Invalid selector: ${selector}`);
		}

		this._selector = EJSON.clone(selector);

		return compileDocumentSelector(selector, this, { isRoot: true });
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
