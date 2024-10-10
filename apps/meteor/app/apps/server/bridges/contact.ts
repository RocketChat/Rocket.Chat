import type { IAppServerOrchestrator } from '@rocket.chat/apps';
import { ContactBridge } from '@rocket.chat/apps-engine/server/bridges';
import type { ILivechatContact } from '@rocket.chat/core-typings';
import { LivechatContacts } from '@rocket.chat/models';

export class AppContactBridge extends ContactBridge {
	constructor(private readonly orch: IAppServerOrchestrator) {
		super();
	}

	async getById(id: ILivechatContact['_id'], appId: string): Promise<ILivechatContact> {
		this.orch.debugLog(`The app ${appId} is fetching a contact`);
		return (await LivechatContacts.findOne({ _id: id })) as ILivechatContact;
	}

	verifyContact(
		_verifyContactChannelParams: {
			contactId: string;
			field: string;
			value: string;
			channelName: string;
			visitorId: string;
			roomId: string;
		},
		appId: string,
	): Promise<void> {
		this.orch.debugLog(`The app ${appId} is fetching a contact`);
		throw new Error('TODO');
	}
}
