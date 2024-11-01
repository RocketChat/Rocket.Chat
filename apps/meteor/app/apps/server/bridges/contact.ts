import type { IAppServerOrchestrator } from '@rocket.chat/apps';
import type { ILivechatContact } from '@rocket.chat/apps-engine/definition/livechat';
import { ContactBridge } from '@rocket.chat/apps-engine/server/bridges';

import { addContactEmail } from '../../../livechat/server/lib/contacts/addContactEmail';
import { verifyContactChannel } from '../../../livechat/server/lib/contacts/verifyContactChannel';

export class AppContactBridge extends ContactBridge {
	constructor(private readonly orch: IAppServerOrchestrator) {
		super();
	}

	async getById(contactId: ILivechatContact['_id'], appId: string): Promise<ILivechatContact | undefined> {
		this.orch.debugLog(`The app ${appId} is fetching a contact`);
		return this.orch.getConverters().get('contacts').convertById(contactId);
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

	protected async addContactEmail(contactId: ILivechatContact['_id'], email: string, appId: string): Promise<ILivechatContact> {
		this.orch.debugLog(`The app ${appId} is adding a new email to the contact`);
		const contact = await addContactEmail(contactId, email);
		return this.orch.getConverters().get('contacts').convertContact(contact);
	}
}
