import type { IUser } from '@rocket.chat/core-typings';
import { CallHistory } from '@rocket.chat/models';

import { logger } from '../logger';
import type { MitelCallItem } from './definition';
import { convertMitelHistoryItem } from './parse/convertMitelHistoryItem';

export async function importHistoryItems(uid: IUser['_id'], items: MitelCallItem[]): Promise<void> {
	for (const item of items) {
		try {
			const record = convertMitelHistoryItem(item, uid);

			await CallHistory.importHistoryItem(record);
		} catch (err) {
			logger.error({ msg: 'Failed to import Call History Item', uid, err });
		}
	}
}
