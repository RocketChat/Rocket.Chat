import type { IUser } from '@rocket.chat/core-typings';
import { CallHistory } from '@rocket.chat/models';

import { logger } from '../logger';
import type { MitelCallItem } from './definition';
import { lookupDirectoryNumbers } from './lookupDirectoryNumbers';
import { normalizeMitelNumber } from './normalizeMitelNumber';
import { convertMitelHistoryItem } from './parse/convertMitelHistoryItem';

export async function importHistoryItems(uid: IUser['_id'], items: MitelCallItem[]): Promise<void> {
	const nameMap = await lookupDirectoryNumbers(items);

	const numberLookup = (number?: string) => {
		const normalized = normalizeMitelNumber(number);
		if (!normalized) {
			return null;
		}

		const user = nameMap.get(normalized);
		if (!user) {
			return null;
		}

		return {
			uid: user._id,
			name: user.name,
			username: user.username,
		};
	};

	for (const item of items) {
		try {
			const record = convertMitelHistoryItem(item, uid, { numberLookup });

			await CallHistory.importHistoryItem(record);
		} catch (err) {
			logger.error({ msg: 'Failed to import Call History Item', uid, err });
		}
	}
}
