import type { ISmarshHistory, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { ISmarshHistoryModel } from '@rocket.chat/model-typings';
import type { Collection } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class SmarshHistoryRaw extends BaseRaw<ISmarshHistory> implements ISmarshHistoryModel {
	constructor(trash?: Collection<RocketChatRecordDeleted<ISmarshHistory>>) {
		super('smarsh_history', trash);
	}
}
