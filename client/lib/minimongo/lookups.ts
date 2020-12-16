export type Document = Record<string, unknown> | undefined | null;

const isNullDocument = (doc: unknown): doc is undefined | null =>
	doc === undefined || doc === null;

const isEmptyArray = (value: unknown): value is unknown[] & { length: 0 } =>
	Array.isArray(value) && value.length === 0;

export const createLookupFunction = (key: string): ((doc: Document) => unknown[]) => {
	const [first, rest] = key.split(/\.(.+)/);

	if (!rest) {
		return (doc: Document): unknown[] => {
			if (isNullDocument(doc)) {
				return [undefined];
			}

			return [doc[first]];
		};
	}

	const lookupRest = createLookupFunction(rest);
	const nextIsNumeric = /^\d+(\.|$)/.test(rest);

	const isDocumentArray = (value: unknown): value is Document[] =>
		Array.isArray(value) || nextIsNumeric;

	return (doc: Document): unknown[] => {
		if (isNullDocument(doc)) {
			return [undefined];
		}

		const firstLevel = doc[first];

		if (isEmptyArray(firstLevel)) {
			return [undefined];
		}

		const docs = isDocumentArray(firstLevel) ? firstLevel : [firstLevel as Document];
		return Array.prototype.concat.apply([], docs.map(lookupRest));
	};
};
