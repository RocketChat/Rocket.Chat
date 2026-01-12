import type { CallHistoryItem, IRegisterUser } from '@rocket.chat/core-typings';
import type { ICallHistoryModel } from '@rocket.chat/model-typings';
import type { Db, FindOptions, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class CallHistoryRaw extends BaseRaw<CallHistoryItem> implements ICallHistoryModel {
	constructor(db: Db) {
		super(db, 'call_history');
	}

	protected override modelIndexes(): IndexDescription[] {
		return [{ key: { uid: 1, callId: 1 }, unique: true }, { key: { uid: 1, ts: -1 } }];
	}

	async findOneByIdAndUid(
		_id: CallHistoryItem['_id'],
		uid: CallHistoryItem['uid'],
		options?: FindOptions<CallHistoryItem>,
	): Promise<CallHistoryItem | null> {
		return this.findOne({ _id, uid }, options);
	}

	async findOneByCallIdAndUid(
		callId: CallHistoryItem['callId'],
		uid: CallHistoryItem['uid'],
		options?: FindOptions<CallHistoryItem>,
	): Promise<CallHistoryItem | null> {
		return this.findOne({ callId, uid }, options);
	}

	public async updateUserReferences(
		userId: IRegisterUser['_id'],
		username: IRegisterUser['username'],
		name?: IRegisterUser['name'],
	): Promise<void> {
		await this.updateMany(
			{
				contactId: userId,
			},
			{
				$set: {
					contactUsername: username,
					...(name && { contactName: name }),
				},
			},
		);
	}
}
