import type { ISmarshHistory, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { ISmarshHistoryModel } from '@rocket.chat/model-typings';
import type { Db, Collection } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class SmarshHistoryRaw extends BaseRaw<ISmarshHistory> implements ISmarshHistoryModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ISmarshHistory>>) {
		super(db, 'smarsh_history', trash);
	}
}
