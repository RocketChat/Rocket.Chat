import { objectMap } from '@rocket.chat/tools';

export function filterOutMissingData<T extends Record<string, any>>(data: T): T {
	return objectMap(
		data,
		({ key, value }) => {
			if (typeof value !== 'boolean') {
				if (!value || value === '0') {
					return;
				}
			}

			if (typeof value === 'object' && !(value instanceof Date) && !Array.isArray(value) && !Object.keys(value).length) {
				return;
			}

			return { key, value };
		},
		true,
	) as T;
}
