import type { IAppServerOrchestrator } from '@rocket.chat/apps';
import { CloudWorkspaceBridge } from '@rocket.chat/apps/dist/server/bridges/CloudWorkspaceBridge';
import type { IWorkspaceToken } from '@rocket.chat/apps-engine/definition/cloud/IWorkspaceToken';

import { getWorkspaceAccessTokenWithScope } from '../../../cloud/server';

export class AppCloudBridge extends CloudWorkspaceBridge {
	constructor(private readonly orch: IAppServerOrchestrator) {
		super();
	}

	public async getWorkspaceToken(scope: string, appId: string): Promise<IWorkspaceToken> {
		this.orch.debugLog(`App ${appId} is getting the workspace's token`);

		const token = await getWorkspaceAccessTokenWithScope({ scope });

		return token;
	}
}
