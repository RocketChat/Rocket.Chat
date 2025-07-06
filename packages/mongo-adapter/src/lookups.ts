import { isIndexable, isNumericKey, isPlainObject } from './common';
import type { ArrayIndices, LookupBranch } from './types';

const buildResult = (arrayIndices: ArrayIndices | undefined, dontIterate: boolean, value: unknown): [LookupBranch] => {
	if (arrayIndices?.length) {
		if (dontIterate) {
			return [{ arrayIndices, dontIterate, value }];
		}
		return [{ arrayIndices, value }];
	}
	if (dontIterate) {
		return [{ dontIterate, value }];
	}
	return [{ value }];
};

export const createLookupFunction = (
	key: string,
	options: { forSort?: boolean } = {},
): (<T>(doc: T, arrayIndices?: ArrayIndices) => LookupBranch[]) => {
	const [firstPart = '', ...rest] = key.split('.');
	const lookupRest = rest.length > 0 ? createLookupFunction(rest.join('.'), options) : undefined;

	return <T>(doc: T, arrayIndices?: ArrayIndices): LookupBranch[] => {
		if (Array.isArray(doc)) {
			if (!(isNumericKey(firstPart) && +firstPart < doc.length)) {
				return [];
			}

			arrayIndices = arrayIndices ? arrayIndices.concat(+firstPart, 'x') : [+firstPart, 'x'];
		}

		const firstLevel = doc[firstPart as keyof typeof doc];

		if (!lookupRest) {
			return buildResult(arrayIndices, Array.isArray(doc) && Array.isArray(firstLevel), firstLevel);
		}

		if (!isIndexable(firstLevel)) {
			if (Array.isArray(doc)) {
				return [];
			}

			return buildResult(arrayIndices, false, undefined);
		}

		const result: LookupBranch[] = lookupRest(firstLevel, arrayIndices);

		if (Array.isArray(firstLevel) && !(isNumericKey(rest[0]) && options.forSort)) {
			firstLevel.forEach((branch, arrayIndex) => {
				if (isPlainObject(branch)) {
					result.push(...lookupRest(branch, arrayIndices ? [...arrayIndices, arrayIndex] : [arrayIndex]));
				}
			});
		}

		return result;
	};
};
