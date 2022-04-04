import { isEmptyArray } from './comparisons';

const isNullDocument = (doc: unknown): doc is undefined | null => doc === undefined || doc === null;

const isRecordDocument = (doc: unknown): doc is Record<string, unknown> =>
	doc !== undefined && doc !== null && (typeof doc === 'object' || typeof doc === 'function');

const isIndexedByNumber = <T>(value: unknown, isIndexedByNumber: boolean): value is T[] => Array.isArray(value) || isIndexedByNumber;

export const createLookupFunction = <T>(key: string): ((doc: T) => unknown[]) => {
	const [first, rest] = key.split(/\.(.+)/);

	if (!rest) {
		return <T>(doc: T): unknown[] => {
			if (isNullDocument(doc) || !isRecordDocument(doc)) {
				return [undefined];
			}

			return [doc[first]];
		};
	}

	const lookupRest = createLookupFunction(rest);
	const nextIsNumeric = /^\d+(\.|$)/.test(rest);

	return <T>(doc: T): unknown[] => {
		if (isNullDocument(doc) || !isRecordDocument(doc)) {
			return [undefined];
		}

		const firstLevel = doc[first];

		if (isEmptyArray(firstLevel)) {
			return [undefined];
		}

		const docs = isIndexedByNumber(firstLevel, nextIsNumeric) ? firstLevel : [firstLevel as T];
		return Array.prototype.concat.apply([], docs.map(lookupRest));
	};
};
