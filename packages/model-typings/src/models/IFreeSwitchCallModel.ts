import type { IFreeSwitchCall } from '@rocket.chat/core-typings';
import type { FindCursor, FindOptions, WithoutId } from 'mongodb';

import type { IBaseModel, InsertionModel } from './IBaseModel';

export interface IFreeSwitchCallModel extends IBaseModel<IFreeSwitchCall> {
	registerCall(call: WithoutId<InsertionModel<IFreeSwitchCall>>): Promise<void>;
	findAllByChannelUniqueIds<T extends IFreeSwitchCall>(uniqueIds: string[], options?: FindOptions<IFreeSwitchCall>): FindCursor<T>;
}
