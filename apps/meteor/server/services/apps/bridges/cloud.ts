import { CloudWorkspaceBridge } from '@rocket.chat/apps-engine/server/bridges/CloudWorkspaceBridge';
import type { IWorkspaceToken } from '@rocket.chat/apps-engine/definition/cloud/IWorkspaceToken';

import { Cloud } from '../../../sdk';
import type { AppServerOrchestrator } from '../orchestrator';

export class AppCloudBridge extends CloudWorkspaceBridge {
	// eslint-disable-next-line no-empty-function
	constructor(private readonly orch: AppServerOrchestrator) {
		super();
	}

	public async getWorkspaceToken(scope: string, appId: string): Promise<IWorkspaceToken> {
		this.orch.debugLog(`App ${appId} is getting the workspace's token`);

		const token = await Cloud.getWorkspaceAccessTokenWithScope(scope);

		return token;
	}
}
