import type { IContactRead } from '@rocket.chat/apps-engine/definition/accessors/IContactRead';
import type { ILivechatContact } from '@rocket.chat/apps-engine/definition/livechat';

import type { AppBridges } from '../bridges';

export class ContactRead implements IContactRead {
	constructor(
		private readonly bridges: AppBridges,
		private readonly appId: string,
	) {}

	public getById(contactId: ILivechatContact['_id']): Promise<ILivechatContact | undefined> {
		return this.bridges.getContactBridge().doGetById(contactId, this.appId);
	}
}
