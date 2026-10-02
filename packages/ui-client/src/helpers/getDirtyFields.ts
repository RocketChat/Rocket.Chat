import type { FieldValues } from 'react-hook-form';

/**
 * Helper function to get dirty fields from react-hook-form
 * @param allFields all fields object
 * @param dirtyFields dirty fields object
 * @returns all dirty fields object
 */
export const getDirtyFields = <T extends FieldValues>(
	allFields: T,
	dirtyFields: Partial<Record<keyof T, boolean | boolean[]>>,
): Partial<T> => {
	const dirtyFieldsObjValue = Object.keys(dirtyFields).reduce((acc, currentField) => {
		const isDirty = Array.isArray(dirtyFields[currentField])
			? (dirtyFields[currentField] as boolean[]).some((value) => value === true)
			: dirtyFields[currentField] === true;
		if (isDirty) {
			return {
				...acc,
				[currentField]: allFields[currentField],
			};
		}
		return acc;
	}, {} as Partial<T>);

	return dirtyFieldsObjValue;
};
