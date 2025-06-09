import type { IFreeSwitchChannelEvent } from '@rocket.chat/core-typings';
import type { FindCursor, FindOptions, WithoutId, InsertOneResult } from 'mongodb';

import type { IBaseModel, InsertionModel } from './IBaseModel';

export interface IFreeSwitchChannelEventModel extends IBaseModel<IFreeSwitchChannelEvent> {
	registerEvent(event: WithoutId<InsertionModel<IFreeSwitchChannelEvent>>): Promise<InsertOneResult<IFreeSwitchChannelEvent>>;
	// findAllByCallUniqueId<T extends IFreeSwitchChannelEvent>(
	// 	callUniqueId: string,
	// 	options?: FindOptions<IFreeSwitchChannelEvent>,
	// ): FindCursor<T>;
	findAllByChannelUniqueId<T extends IFreeSwitchChannelEvent>(
		uniqueId: string,
		options?: FindOptions<IFreeSwitchChannelEvent>,
	): FindCursor<T>;
}
