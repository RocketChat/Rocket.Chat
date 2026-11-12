import type { IWorkspaceToken } from '@rocket.chat/apps-engine/definition/cloud/IWorkspaceToken.js';

import { CloudWorkspaceBridge } from '../../../src/server/bridges/CloudWorkspaceBridge.js';

export class TestAppCloudWorkspaceBridge extends CloudWorkspaceBridge {
	constructor() {
		super();
	}

	public async getWorkspaceToken(scope: string, appId: string): Promise<IWorkspaceToken> {
		return {
			token: 'mock-workspace-token',
			expiresAt: new Date(Date.now() + 10000),
		};
	}
}
