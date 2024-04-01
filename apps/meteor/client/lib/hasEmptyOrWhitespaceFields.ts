import type { FieldValues } from 'react-hook-form';

type FieldCheck = Partial<Record<string, boolean>>;

/**
 * Helper function to check if fields contain only whitespace
 * @param fields fields object
 * @param checkFields fields to check for whitespace
 * @returns true if any field contains only whitespace, false otherwise
 */
export const hasEmptyOrWhitespaceFields = (fields: FieldValues, checkFields: FieldCheck): boolean => {
	return Object.keys(checkFields).some((field) => {
		const isWhitespace = /^\s+$/.test(String(fields[field]));

		return checkFields[field] && isWhitespace;
	});
};
