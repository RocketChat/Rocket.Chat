import type { IFreeSwitchChannel } from '@rocket.chat/core-typings';
import type { FindCursor, FindOptions, WithoutId, InsertOneResult } from 'mongodb';

import type { IBaseModel, InsertionModel } from './IBaseModel';

export interface IFreeSwitchChannelModel extends IBaseModel<IFreeSwitchChannel> {
	registerChannel(channel: WithoutId<InsertionModel<IFreeSwitchChannel>>): Promise<InsertOneResult<IFreeSwitchChannel>>;
	findAllByUniqueIds<T extends IFreeSwitchChannel>(uniqueIds: string[], options?: FindOptions<IFreeSwitchChannel>): FindCursor<T>;
}
