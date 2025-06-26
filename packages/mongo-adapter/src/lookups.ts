const isNullDocument = (doc: unknown): doc is undefined | null => doc === undefined || doc === null;

const isRecordDocument = (doc: unknown): doc is Record<string, unknown> =>
	doc !== undefined && doc !== null && (typeof doc === 'object' || typeof doc === 'function');

export const createLookupFunction = (key: string): (<T>(doc: T) => unknown[]) => {
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

		const nestedDoc = doc[first];

		if (Array.isArray(nestedDoc)) {
			if (nestedDoc.length === 0) {
				return [undefined];
			}

			if (nextIsNumeric) {
				return lookupRest(nestedDoc).concat(nestedDoc.flatMap((item) => lookupRest(item)));
			}

			return nestedDoc.flatMap((item) => lookupRest(item));
		}

		return lookupRest(nestedDoc);
	};
};
