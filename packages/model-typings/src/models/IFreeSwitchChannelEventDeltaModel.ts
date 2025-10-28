import type { IFreeSwitchChannelEventDelta } from '@rocket.chat/core-typings';
import type { WithoutId, InsertOneResult } from 'mongodb';

import type { IBaseModel, InsertionModel } from './IBaseModel';

export interface IFreeSwitchChannelEventDeltaModel extends IBaseModel<IFreeSwitchChannelEventDelta> {
	registerDelta(channel: InsertionModel<WithoutId<IFreeSwitchChannelEventDelta>>): Promise<InsertOneResult<IFreeSwitchChannelEventDelta>>;
}
