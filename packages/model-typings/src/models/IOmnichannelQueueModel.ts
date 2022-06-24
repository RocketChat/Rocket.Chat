import type { IOmnichannelQueueStatus } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IOmnichannelQueueModel extends IBaseModel<IOmnichannelQueueStatus> {
	initQueue(): any;
	stopQueue(): any;
	lockQueue(): Promise<any>;
	unlockQueue(): Promise<any>;
}
