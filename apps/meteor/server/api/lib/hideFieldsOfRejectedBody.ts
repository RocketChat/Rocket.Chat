import { isRecord } from '@rocket.chat/tools';
import type { ValidateFunction } from 'ajv';

/**
 * Validates like `validate`, and replaces the named string fields of a body it rejects with their length, so a rejected
 * body can be logged without their content.
 */
export const hideFieldsOfRejectedBody = <T>(validate: ValidateFunction<T>, fields: (keyof T & string)[]): ValidateFunction<T> => {
	const validateAndHide: ValidateFunction<T> = Object.assign(
		(body: unknown): body is T => {
			const valid = validate(body);
			validateAndHide.errors = validate.errors;

			if (!valid && isRecord(body)) {
				for (const field of fields) {
					const value = body[field];
					if (typeof value === 'string') {
						body[field] = `[${value.length} characters]`;
					}
				}
			}

			return valid;
		},
		{ schema: validate.schema, schemaEnv: validate.schemaEnv },
	);

	return validateAndHide;
};
