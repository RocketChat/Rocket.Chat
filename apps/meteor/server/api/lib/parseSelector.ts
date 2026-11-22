import { ClientSafeError } from '@rocket.chat/core-services';

import { isPlainObject } from '../../../lib/utils/isPlainObject';

/**
 * Reads the JSON `selector` query parameter of the autocomplete endpoints, refusing one that is not a JSON object.
 */
export function parseSelector<T extends object>(selector: string): T {
	let parsed: unknown;
	try {
		parsed = JSON.parse(selector);
	} catch {
		parsed = undefined;
	}

	if (!isPlainObject(parsed)) {
		throw new ClientSafeError('error-invalid-params', 'The selector must be a JSON object');
	}

	return parsed as T;
}
