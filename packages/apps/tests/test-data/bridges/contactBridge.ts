import type { ILivechatContact } from '@rocket.chat/apps-engine/definition/livechat/index.js';

import { ContactBridge } from '../../../src/server/bridges/index.js';

export class TestContactBridge extends ContactBridge {
	protected addContactEmail(contactId: ILivechatContact['_id'], email: string, appId: string): Promise<ILivechatContact> {
		throw new Error('Method not implemented.');
	}

	protected getById(id: ILivechatContact['_id']): Promise<ILivechatContact> {
		throw new Error('Method not implemented.');
	}

	protected verifyContact(verifyContactChannelParams: {
		contactId: string;
		field: string;
		value: string;
		visitorId: string;
		roomId: string;
	}): Promise<void> {
		throw new Error('Method not implemented.');
	}
}
