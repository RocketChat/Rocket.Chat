import type { IContactRead } from '@rocket.chat/apps-engine/definition/accessors/IContactRead';
import type { ILivechatContact } from '@rocket.chat/apps-engine/definition/livechat';

import type { RemoteBridges } from '../../bridges/RemoteBridges';

export class ContactRead implements IContactRead {
	constructor(private readonly bridges: RemoteBridges) {}

	public getById(contactId: ILivechatContact['_id']): Promise<ILivechatContact | undefined> {
		return this.bridges.getContactBridge().doGetById(contactId, 'APP_ID') as Promise<ILivechatContact | undefined>;
	}
}
