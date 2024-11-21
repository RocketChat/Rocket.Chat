import type { IFreeSwitchChannel, IFreeSwitchChannelEvent } from '@rocket.chat/core-typings';
import type { FindCursor, FindOptions } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IFreeSwitchChannelModel extends IBaseModel<IFreeSwitchChannel> {
	registerEvent(uniqueId: string, event: IFreeSwitchChannelEvent, channelData?: Partial<IFreeSwitchChannel>): Promise<void>;

	linkUniqueIds(uniqueIds: string[]): Promise<void>;

	findOneByUniqueId<T extends IFreeSwitchChannel>(uniqueId: string, options?: FindOptions<IFreeSwitchChannel>): Promise<T | null>;

	findAllByUniqueIds<T extends IFreeSwitchChannel>(uniqueIds: string[], options?: FindOptions<IFreeSwitchChannel>): FindCursor<T>;

	setCallIdByIds(ids: string[], callId: string): Promise<void>;
}
