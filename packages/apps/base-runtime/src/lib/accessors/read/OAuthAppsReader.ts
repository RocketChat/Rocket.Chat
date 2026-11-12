import type { IOAuthApp } from '@rocket.chat/apps-engine/definition/accessors/IOAuthApp.js';
import type { IOAuthAppsReader } from '@rocket.chat/apps-engine/definition/accessors/IOAuthAppsReader.js';

import { bridgeCall } from '../../bridges/bridgeCall.js';
import type * as Messenger from '../../messenger.js';

export class OAuthAppsReader implements IOAuthAppsReader {
	constructor(private readonly senderFn: typeof Messenger.sendRequest) {}

	public async getOAuthAppById(id: string): Promise<IOAuthApp> {
		return bridgeCall<IOAuthApp>(this.senderFn, 'getOAuthAppsBridge', 'doGetByid', id, 'APP_ID');
	}

	public async getOAuthAppByName(name: string): Promise<Array<IOAuthApp>> {
		return bridgeCall<Array<IOAuthApp>>(this.senderFn, 'getOAuthAppsBridge', 'doGetByName', name, 'APP_ID');
	}
}
