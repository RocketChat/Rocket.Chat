import type { IContactCreator } from '@rocket.chat/apps-engine/definition/accessors/IContactCreator.js';
import type { ILivechatContact } from '@rocket.chat/apps-engine/definition/livechat/index.js';

import { bridgeCall } from '../../bridges/bridgeCall.js';
import type * as Messenger from '../../messenger.js';

export class ContactCreator implements IContactCreator {
	constructor(private readonly senderFn: typeof Messenger.sendRequest) {}

	public verifyContact(verifyContactChannelParams: {
		contactId: string;
		field: string;
		value: string;
		visitorId: string;
		roomId: string;
	}): Promise<void> {
		return bridgeCall<void>(this.senderFn, 'getContactBridge', 'doVerifyContact', verifyContactChannelParams, 'APP_ID');
	}

	public addContactEmail(contactId: ILivechatContact['_id'], email: string): Promise<ILivechatContact> {
		return bridgeCall<ILivechatContact>(this.senderFn, 'getContactBridge', 'doAddContactEmail', contactId, email, 'APP_ID');
	}
}
