import type { ICloudWorkspaceRead } from '@rocket.chat/apps-engine/definition/accessors/ICloudWorkspaceRead';
import type { IWorkspaceToken } from '@rocket.chat/apps-engine/definition/cloud/IWorkspaceToken';

import { bridgeCall } from '../../bridges/bridgeCall';
import type * as Messenger from '../../messenger';

export class CloudWorkspaceRead implements ICloudWorkspaceRead {
	constructor(private readonly senderFn: typeof Messenger.sendRequest) {}

	public async getWorkspaceToken(scope: string): Promise<IWorkspaceToken> {
		return bridgeCall<IWorkspaceToken>(this.senderFn, 'getCloudWorkspaceBridge', 'doGetWorkspaceToken', scope, 'APP_ID');
	}
}
