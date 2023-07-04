import type { IOmnichannelQueue } from '@rocket.chat/core-typings';

import type { IServiceClass } from './ServiceClass';

export interface IOmnichannelService extends IServiceClass {
	getQueueWorker(): IOmnichannelQueue;
}
