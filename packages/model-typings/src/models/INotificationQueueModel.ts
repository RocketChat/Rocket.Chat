import type { Document, UpdateResult } from 'mongodb';
import type { INotification } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface INotificationQueueModel extends IBaseModel<INotification> {
	unsetSendingById(_id: string): Promise<UpdateResult>;
	setErrorById(_id: string, error: any): Promise<UpdateResult>;
	clearScheduleByUserId(uid: string): Promise<UpdateResult | Document>;
	clearQueueByUserId(uid: string): Promise<number | undefined>;
	findNextInQueueOrExpired(expired: Date): Promise<INotification | null>;
}
