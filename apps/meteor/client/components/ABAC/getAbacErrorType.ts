import type { IAbacAttributeDefinition } from '@rocket.chat/core-typings';

export const getAbacErrorType = (error: unknown): string | undefined => {
	if (typeof error !== 'object' || error === null || !('errorType' in error) || typeof error.errorType !== 'string') {
		return undefined;
	}

	return error.errorType.startsWith('error-abac-') ? error.errorType : undefined;
};

const isAttributeDefinition = (value: unknown): value is IAbacAttributeDefinition =>
	typeof value === 'object' &&
	value !== null &&
	'key' in value &&
	typeof value.key === 'string' &&
	'values' in value &&
	Array.isArray(value.values) &&
	value.values.every((item) => typeof item === 'string');

export const getAbacErrorAttributes = (error: unknown): IAbacAttributeDefinition[] => {
	if (typeof error !== 'object' || error === null || !('details' in error) || typeof error.details !== 'object' || error.details === null) {
		return [];
	}

	const { attributes } = error.details as { attributes?: unknown };
	return Array.isArray(attributes) ? attributes.filter(isAttributeDefinition) : [];
};
