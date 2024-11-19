import type { IFreeSwitchChannel, IFreeSwitchChannelEvent } from '@rocket.chat/core-typings';
import type { FindCursor, FindOptions } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IFreeSwitchChannelModel extends IBaseModel<IFreeSwitchChannel> {
	registerEvent(channelUniqueId: string, event: IFreeSwitchChannelEvent, channelData?: Partial<IFreeSwitchChannel>): Promise<void>;

	findAllByUniqueIds(uniqueIds: string[], options?: FindOptions<IFreeSwitchChannel>): FindCursor<IFreeSwitchChannel>;

	getCallIdByUniqueIds(uniqueIds: string[]): Promise<string | undefined>;

	setCallIdByUniqueIds(uniqueIds: string[], callId: string): Promise<void>;
}
