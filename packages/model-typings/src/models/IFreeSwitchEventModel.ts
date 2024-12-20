import type { IFreeSwitchEvent } from '@rocket.chat/core-typings';
import type { FindCursor, FindOptions, WithoutId, InsertOneResult } from 'mongodb';

import type { IBaseModel, InsertionModel } from './IBaseModel';

export interface IFreeSwitchEventModel extends IBaseModel<IFreeSwitchEvent> {
	registerEvent(event: WithoutId<InsertionModel<IFreeSwitchEvent>>): Promise<InsertOneResult<IFreeSwitchEvent>>;
	findAllByCallUUID<T extends IFreeSwitchEvent>(callUUID: string, options?: FindOptions<IFreeSwitchEvent>): FindCursor<T>;
	findAllByChannelUniqueIds<T extends IFreeSwitchEvent>(uniqueIds: string[], options?: FindOptions<IFreeSwitchEvent>): FindCursor<T>;
}
