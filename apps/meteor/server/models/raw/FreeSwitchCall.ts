import type { IFreeSwitchCall, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IFreeSwitchCallModel, InsertionModel } from '@rocket.chat/model-typings';
import type { Collection, Db, FindCursor, FindOptions, IndexDescription, WithoutId } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class FreeSwitchCallRaw extends BaseRaw<IFreeSwitchCall> implements IFreeSwitchCallModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IFreeSwitchCall>>) {
		super(db, 'freeswitch_calls', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { UUID: 1 } }, { key: { channels: 1 } }];
	}

	public async registerCall(call: WithoutId<InsertionModel<IFreeSwitchCall>>): Promise<void> {
		await this.findOneAndUpdate({ UUID: call.UUID }, { $set: call }, { upsert: true });
	}

	public findAllByChannelUniqueIds<T extends IFreeSwitchCall>(uniqueIds: string[], options?: FindOptions<IFreeSwitchCall>): FindCursor<T> {
		return this.find<T>(
			{
				channels: { $in: uniqueIds },
			},
			options,
		);
	}
}
