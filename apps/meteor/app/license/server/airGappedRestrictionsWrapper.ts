import { makeFunction } from '@rocket.chat/patch-injection';

export const applyAirGappedRestrictionsValidation = makeFunction(async <T>(fn: () => Promise<T>): Promise<T> => {
	return fn();
});
