import type { ICloudWorkspaceRead } from '@rocket.chat/apps-engine/definition/accessors/ICloudWorkspaceRead';
import type { IWorkspaceToken } from '@rocket.chat/apps-engine/definition/cloud/IWorkspaceToken';

import type { RemoteBridges } from '../../bridges/RemoteBridges';

export class CloudWorkspaceRead implements ICloudWorkspaceRead {
	constructor(private readonly bridges: RemoteBridges) {}

	public async getWorkspaceToken(scope: string): Promise<IWorkspaceToken> {
		return this.bridges.getCloudWorkspaceBridge().doGetWorkspaceToken(scope, 'APP_ID') as Promise<IWorkspaceToken>;
	}
}
