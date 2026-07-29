import type { IOAuthApp } from '@rocket.chat/apps-engine/definition/accessors/IOAuthApp';
import type { IOAuthAppsReader } from '@rocket.chat/apps-engine/definition/accessors/IOAuthAppsReader';

import type { RemoteBridges } from '../../bridges/RemoteBridges';

export class OAuthAppsReader implements IOAuthAppsReader {
	constructor(private readonly bridges: RemoteBridges) {}

	public async getOAuthAppById(id: string): Promise<IOAuthApp> {
		return this.bridges.getOAuthAppsBridge().doGetByid(id, 'APP_ID') as Promise<IOAuthApp>;
	}

	public async getOAuthAppByName(name: string): Promise<Array<IOAuthApp>> {
		return this.bridges.getOAuthAppsBridge().doGetByName(name, 'APP_ID') as Promise<Array<IOAuthApp>>;
	}
}
