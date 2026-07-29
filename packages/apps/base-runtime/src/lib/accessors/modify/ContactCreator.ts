import type { IContactCreator } from '@rocket.chat/apps-engine/definition/accessors/IContactCreator';
import type { ILivechatContact } from '@rocket.chat/apps-engine/definition/livechat';

import type { RemoteBridges } from '../../bridges/RemoteBridges';

export class ContactCreator implements IContactCreator {
	constructor(private readonly bridges: RemoteBridges) {}

	public verifyContact(verifyContactChannelParams: {
		contactId: string;
		field: string;
		value: string;
		visitorId: string;
		roomId: string;
	}): Promise<void> {
		return this.bridges.getContactBridge().doVerifyContact(verifyContactChannelParams, 'APP_ID') as Promise<void>;
	}

	public addContactEmail(contactId: ILivechatContact['_id'], email: string): Promise<ILivechatContact> {
		return this.bridges.getContactBridge().doAddContactEmail(contactId, email, 'APP_ID') as Promise<ILivechatContact>;
	}
}
