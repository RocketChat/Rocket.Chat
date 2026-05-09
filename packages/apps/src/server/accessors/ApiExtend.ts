import type { IApiExtend } from '@rocket.chat/apps-engine/definition/accessors';
import type { IApi } from '@rocket.chat/apps-engine/definition/api';

import type { AppApiManager } from '../managers/AppApiManager';

export class ApiExtend implements IApiExtend {
	constructor(
		private readonly manager: AppApiManager,
		private readonly appId: string,
	) {}

	public provideApi(api: IApi): Promise<void> {
		return Promise.resolve(this.manager.addApi(this.appId, api));
	}
}
