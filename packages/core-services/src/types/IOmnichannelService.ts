import type { AtLeast } from '@rocket.chat/core-typings';
import type { IOmnichannelQueue, IOmnichannelRoom } from '@rocket.chat/omnichannel-typings';

import type { IServiceClass } from './ServiceClass';

export interface IOmnichannelService extends IServiceClass {
	getQueueWorker(): IOmnichannelQueue;
	isWithinMACLimit(_room: AtLeast<IOmnichannelRoom, 'v'>): Promise<boolean>;
}
