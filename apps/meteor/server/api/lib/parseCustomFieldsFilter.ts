import { isRecord, wrapExceptions } from '@rocket.chat/tools';

export function parseCustomFieldsFilter(raw: string): Record<string, string> {
	const parsed = wrapExceptions(() => JSON.parse(raw)).suppress();

	if (!isRecord(parsed)) {
		throw new Error('customFields must be a JSON object');
	}

	const entries = Object.entries(parsed);

	if (!entries.length) {
		throw new Error('customFields must declare at least one field');
	}

	return Object.fromEntries(
		entries.map(([key, value]) => {
			if (typeof value !== 'string' || !value) {
				throw new Error(`customFields.${key} must be a non-empty string`);
			}

			if (key.includes('$') || key.includes('.')) {
				throw new Error(`The given key contains a period or an operator, which is not allowed. Key: ${key}`);
			}

			return [`customFields.${key}`, value];
		}),
	);
}
