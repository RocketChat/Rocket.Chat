import type { IAppServerOrchestrator } from '@rocket.chat/apps';
import type { ILivechatContact } from '@rocket.chat/apps-engine/definition/livechat';
import { ContactBridge } from '@rocket.chat/apps-engine/server/bridges';
import type { IVisitor } from '@rocket.chat/core-typings';
import { LivechatContacts } from '@rocket.chat/models';

import { addContactEmail } from '../../../livechat/server/lib/contacts/addContactEmail';
import { verifyContactChannel } from '../../../livechat/server/lib/contacts/verifyContactChannel';

export class AppContactBridge extends ContactBridge {
	constructor(private readonly orch: IAppServerOrchestrator) {
		super();
	}

	async getByVisitorId(visitorId: IVisitor['_id'], appId: string): Promise<ILivechatContact | null> {
		this.orch.debugLog(`The app ${appId} is fetching a contact`);
		return LivechatContacts.findOneByVisitorId<ILivechatContact>(visitorId);
	}

	async verifyContact(
		verifyContactChannelParams: {
			contactId: string;
			field: string;
			value: string;
			visitorId: string;
			roomId: string;
		},
		appId: string,
	): Promise<void> {
		this.orch.debugLog(`The app ${appId} is verifing a contact`);
		// Note: If there is more than one app installed, whe should validate the app that called this method to be same one
		//       selected in the setting.
		await verifyContactChannel(verifyContactChannelParams);
	}

	protected addContactEmail(contactId: ILivechatContact['_id'], email: string, appId: string): Promise<ILivechatContact> {
		this.orch.debugLog(`The app ${appId} is adding a new email to the contact`);
		return addContactEmail(contactId, email);
	}
}
