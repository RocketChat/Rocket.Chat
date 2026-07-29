import type { IOAuthAppParams } from '@rocket.chat/apps-engine/definition/accessors/IOAuthApp';
import type { IOAuthAppsModify } from '@rocket.chat/apps-engine/definition/accessors/IOAuthAppsModify';

import type { RemoteBridges } from '../../bridges/RemoteBridges';

export class OAuthAppsModify implements IOAuthAppsModify {
	constructor(private readonly bridges: RemoteBridges) {}

	public async createOAuthApp(oAuthApp: IOAuthAppParams): Promise<string> {
		return this.bridges.getOAuthAppsBridge().doCreate(oAuthApp, 'APP_ID') as Promise<string>;
	}

	public async updateOAuthApp(oAuthApp: IOAuthAppParams, id: string): Promise<void> {
		await this.bridges.getOAuthAppsBridge().doUpdate(oAuthApp, id, 'APP_ID');
	}

	public async deleteOAuthApp(id: string): Promise<void> {
		await this.bridges.getOAuthAppsBridge().doDelete(id, 'APP_ID');
	}
}
