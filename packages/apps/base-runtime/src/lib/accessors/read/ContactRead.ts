import type { IContactRead } from '@rocket.chat/apps-engine/definition/accessors/IContactRead';
import type { ILivechatContact } from '@rocket.chat/apps-engine/definition/livechat';

import { bridgeCall } from '../../bridges/bridgeCall';
import type * as Messenger from '../../messenger';

export class ContactRead implements IContactRead {
	constructor(private readonly senderFn: typeof Messenger.sendRequest) {}

	public getById(contactId: ILivechatContact['_id']): Promise<ILivechatContact | undefined> {
		return bridgeCall<ILivechatContact | undefined>(this.senderFn, 'getContactBridge', 'doGetById', contactId, 'APP_ID');
	}
}
