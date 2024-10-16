import type { AtLeast, ILivechatContact, ILivechatContactChannel, IOmnichannelQueue, IOmnichannelRoom } from '@rocket.chat/core-typings';

import type { IServiceClass } from './ServiceClass';

export interface IOmnichannelService extends IServiceClass {
	getQueueWorker(): IOmnichannelQueue;
	isWithinMACLimit(_room: AtLeast<IOmnichannelRoom, 'v'>): Promise<boolean>;
	mergeContacts(contactId: string, channel: ILivechatContactChannel): Promise<ILivechatContact | null>;
	verifyContactChannel(params: {
		contactId: string;
		field: string;
		value: string;
		channelName: string;
		visitorId: string;
		roomId: string;
	}): Promise<ILivechatContact | null>;
}
