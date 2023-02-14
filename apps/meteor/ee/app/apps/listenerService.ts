import type { IRoom } from '@rocket.chat/core-typings';

import { ServiceClass } from '../../../server/sdk/types/ServiceClass';
import type { IAppsListenerService } from '../../../server/sdk/types/IAppsListenerService';
import type { AppServerOrchestrator } from './orchestrator';
import { OrchestratorFactory } from './orchestratorFactory';

export class AppsListenerService extends ServiceClass implements IAppsListenerService {
	protected name = 'apps';

	private apps: AppServerOrchestrator;

	constructor() {
		super();

		this.apps = OrchestratorFactory.getOrchestrator();
	}

	async roomEvent(interaction: string, room: IRoom): Promise<boolean | IRoom> {
		return this.apps.getBridges()?.getListenerBridge().roomEvent(interaction, room);
	}
}
