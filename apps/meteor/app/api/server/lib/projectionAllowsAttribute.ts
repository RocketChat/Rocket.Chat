import type { IRocketChatRecord } from '@rocket.chat/core-typings';
import type { FindOptions } from 'mongodb';

export function projectionAllowsAttribute(attributeName: string, options?: FindOptions<IRocketChatRecord>): boolean {
	if (!options?.projection) {
		return true;
	}

	if (attributeName in options.projection) {
		return Boolean(options.projection[attributeName]);
	}

	const projectingAllowedFields = Object.values(options.projection).some((value) => Boolean(value));

	// If the attribute is not on the projection list, return the opposite of the values in the projection. aka:
	//     if the projection is specifying blocked fields, then this field is allowed;
	//     if the projection is specifying allowed fields, then this field is blocked;
	return !projectingAllowedFields;
}
