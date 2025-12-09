import type { CallHistoryItem } from '@rocket.chat/core-typings';
import type { FindOptions } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface ICallHistoryModel extends IBaseModel<CallHistoryItem> {
	findOneByIdAndUid(
		_id: CallHistoryItem['_id'],
		uid: CallHistoryItem['uid'],
		options?: FindOptions<CallHistoryItem>,
	): Promise<CallHistoryItem | null>;

	findOneByCallIdAndUid(
		callId: CallHistoryItem['callId'],
		uid: CallHistoryItem['uid'],
		options?: FindOptions<CallHistoryItem>,
	): Promise<CallHistoryItem | null>;
}
