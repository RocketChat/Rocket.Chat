import type { AtLeast, IOmnichannelRoom } from '@rocket.chat/core-typings';

import type { IServiceClass } from './ServiceClass';

export interface IOmnichannelService extends IServiceClass {
	isWithinMACLimit(_room: AtLeast<IOmnichannelRoom, 'v'>): Promise<boolean>;
}
