import type { IApi, IApiEndpoint } from '@rocket.chat/apps-engine/definition/api';
import { ApiBridge } from '@rocket.chat/apps-engine/server/bridges';
import type { AppApi } from '@rocket.chat/apps-engine/server/managers/AppApi';
// import { AppsApiService } from '@rocket.chat/core-services';

import type { AppServerOrchestrator } from '../../../../ee/server/apps/orchestrator';

export class AppApisBridge extends ApiBridge {
	constructor(private readonly orch: AppServerOrchestrator) {
		super();
	}

	protected async registerApi({ api, computedPath, endpoint }: AppApi, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is registering the api: "${endpoint.path}" (${computedPath})`);

		this._verifyApi(api, endpoint);

		// await AppsApiService.registerApi(endpoint, appId);
	}

	protected async unregisterApis(appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is unregistering all apis`);

		// await AppsApiService.unregisterApi(appId);
	}

	private _verifyApi(api: IApi, endpoint: IApiEndpoint): void {
		if (typeof api !== 'object') {
			throw new Error('Invalid Api parameter provided, it must be a valid IApi object.');
		}

		if (typeof endpoint.path !== 'string') {
			throw new Error('Invalid Api parameter provided, it must be a valid IApi object.');
		}
	}
}
