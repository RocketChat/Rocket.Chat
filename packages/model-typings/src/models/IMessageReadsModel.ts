import type { MessageReads, IUser, IMessage } from '@rocket.chat/core-typings';
import type { UpdateResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IMessageReadsModel extends IBaseModel<MessageReads> {
	findOneByUserIdAndThreadId(userId: IUser['_id'], tmid: IMessage['_id']): Promise<MessageReads | null>;
	getMinimumLastSeenByThreadId(tmid: string): Promise<MessageReads | null>;
	updateReadTimestampByUserIdAndThreadId(userId: IUser['_id'], tmid: IMessage['_id']): Promise<UpdateResult>;
	countByThreadAndUserIds(tmid: IMessage['_id'], userIds: IUser['_id'][]): Promise<number>;
	countByThreadId(tmid: IMessage['_id']): Promise<number>;
}
