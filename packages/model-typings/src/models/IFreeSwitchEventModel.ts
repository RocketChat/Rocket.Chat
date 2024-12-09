import type { IFreeSwitchEvent } from '@rocket.chat/core-typings';
import type { FindCursor, FindOptions, WithoutId } from 'mongodb';

import type { IBaseModel, InsertionModel } from './IBaseModel';

export interface IFreeSwitchEventModel extends IBaseModel<IFreeSwitchEvent> {
	registerEvent(event: WithoutId<InsertionModel<IFreeSwitchEvent>>): Promise<void>;
	findAllByCallUUID<T extends IFreeSwitchEvent>(callUUID: string, options?: FindOptions<IFreeSwitchEvent>): FindCursor<T>;
	findAllByChannelUniqueIds<T extends IFreeSwitchEvent>(uniqueIds: string[], options?: FindOptions<IFreeSwitchEvent>): FindCursor<T>;
}
