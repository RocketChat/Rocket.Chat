import type { UpdateWriteOpResult } from 'mongodb';
import type { INotification } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface INotificationQueueModel extends IBaseModel<INotification> {
	unsetSendingById(_id: string): Promise<UpdateWriteOpResult>;
	setErrorById(_id: string, error: any): Promise<UpdateWriteOpResult>;
	clearScheduleByUserId(uid: string): Promise<UpdateWriteOpResult>;
	clearQueueByUserId(uid: string): Promise<number | undefined>;
	findNextInQueueOrExpired(expired: Date): Promise<INotification | undefined>;
}
