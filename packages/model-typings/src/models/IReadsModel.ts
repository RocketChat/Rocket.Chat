import type { UpdateResult } from 'mongodb';
import type { Reads, IUser, IMessage } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IReadsModel extends IBaseModel<Reads> {
	findOneByUserIdAndThreadId(userId: IUser['_id'], tmid: IMessage['_id']): Promise<Reads | null>;
	getMinimumLastSeenByThreadId(tmid: string): Promise<Reads | null>;
	updateReadTimestampByUserIdAndThreadId(userId: IUser['_id'], tmid: IMessage['_id']): Promise<UpdateResult>;
}
