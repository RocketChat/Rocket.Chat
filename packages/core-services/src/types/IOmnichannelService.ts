import type { AtLeast, IOmnichannelQueue, IOmnichannelRoom } from '@rocket.chat/core-typings';

import type { IServiceClass } from './ServiceClass';

export interface IOmnichannelService extends IServiceClass {
	getQueueWorker(): IOmnichannelQueue;
	isWithinMACLimit(_room: AtLeast<IOmnichannelRoom, 'v'>): Promise<boolean>;
}
