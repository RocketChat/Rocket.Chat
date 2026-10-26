import { logger } from '../../logger';
import type { MitelCallItem } from '../definition';
import { parseMitelCallItem } from './parseMitelCallItem';

function isRecord(obj: unknown): obj is Record<string, unknown> {
	return Boolean(obj) && typeof obj === 'object' && !Array.isArray(obj);
}

export function parseMitelJSON(json: string): MitelCallItem[] | null {
	try {
		const parsed = JSON.parse(json) as Record<string, any>;

		if (!Array.isArray(parsed.callItems)) {
			throw new Error('Unexpected data structure.');
		}

		return parsed.callItems.filter(isRecord).map((item) => parseMitelCallItem(item));
	} catch (err) {
		logger.error({
			msg: 'Failed to parse response from External Call History request',
			err,
		});
		return null;
	}
}
