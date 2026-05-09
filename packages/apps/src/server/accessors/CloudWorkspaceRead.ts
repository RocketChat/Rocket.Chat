import type { ICloudWorkspaceRead } from '@rocket.chat/apps-engine/definition/accessors/ICloudWorkspaceRead';
import type { IWorkspaceToken } from '@rocket.chat/apps-engine/definition/cloud/IWorkspaceToken';

import type { CloudWorkspaceBridge } from '../bridges/CloudWorkspaceBridge';

export class CloudWorkspaceRead implements ICloudWorkspaceRead {
	constructor(
		private readonly cloudBridge: CloudWorkspaceBridge,
		private readonly appId: string,
	) {}

	public async getWorkspaceToken(scope: string): Promise<IWorkspaceToken> {
		return this.cloudBridge.doGetWorkspaceToken(scope, this.appId);
	}
}
