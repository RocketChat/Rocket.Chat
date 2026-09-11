import type { IOAuthAppParams } from '@rocket.chat/apps-engine/definition/accessors/IOAuthApp';
import type { IOAuthAppsModify } from '@rocket.chat/apps-engine/definition/accessors/IOAuthAppsModify';

import { bridgeCall } from '../../bridges/bridgeCall';
import type * as Messenger from '../../messenger';

export class OAuthAppsModify implements IOAuthAppsModify {
	constructor(private readonly senderFn: typeof Messenger.sendRequest) {}

	public async createOAuthApp(oAuthApp: IOAuthAppParams): Promise<string> {
		return bridgeCall<string>(this.senderFn, 'getOAuthAppsBridge', 'doCreate', oAuthApp, 'APP_ID');
	}

	public async updateOAuthApp(oAuthApp: IOAuthAppParams, id: string): Promise<void> {
		await bridgeCall(this.senderFn, 'getOAuthAppsBridge', 'doUpdate', oAuthApp, id, 'APP_ID');
	}

	public async deleteOAuthApp(id: string): Promise<void> {
		await bridgeCall(this.senderFn, 'getOAuthAppsBridge', 'doDelete', id, 'APP_ID');
	}
}
