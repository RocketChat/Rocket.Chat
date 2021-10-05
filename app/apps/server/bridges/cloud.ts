import { Meteor } from 'meteor/meteor';
import { ICloudWorkspaceBridge } from '@rocket.chat/apps-engine/server/bridges';
import { IWorkspaceToken } from '@rocket.chat/apps-engine/definition/cloud/IWorkspaceToken';

import { getWorkspaceAccessTokenWithScope } from '../../../cloud/server';
import { AppServerOrchestrator } from '../orchestrator';

const boundGetWorkspaceAccessToken = Meteor.bindEnvironment(getWorkspaceAccessTokenWithScope);

export class AppCloudBridge implements ICloudWorkspaceBridge {
	// eslint-disable-next-line no-empty-function
	constructor(private readonly orch: AppServerOrchestrator) {}

	public async getWorkspaceToken(scope: string, appId: string): Promise<IWorkspaceToken> {
		this.orch.debugLog(`App ${ appId } is getting the workspace's token`);

		const token = boundGetWorkspaceAccessToken(scope);

		return token;
	}
}
