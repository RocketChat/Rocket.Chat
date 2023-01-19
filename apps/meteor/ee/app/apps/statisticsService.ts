import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';

import { ServiceClass } from '../../../server/sdk/types/ServiceClass';
import type { IAppsStatisticsService } from '../../../server/sdk/types/IAppsStatisticsService';
import type { AppServerOrchestrator } from './orchestrator';
import { OrchestratorFactory } from './orchestratorFactory';

export type AppStatistics = {
	totalInstalled: number | false;
	totalActive: number | false;
	totalFailed: number | false;
};

export class AppsStatisticsService extends ServiceClass implements IAppsStatisticsService {
	protected name = 'apps';

	private apps: AppServerOrchestrator;

	constructor() {
		super();

		this.apps = OrchestratorFactory.getOrchestrator();
	}

	getStatistics(): AppStatistics {
		const isInitialized = this.apps.isInitialized();
		const manager = this.apps.getManager();

		const totalInstalled = isInitialized && manager?.get().length;
		const totalActive = isInitialized && manager?.get({ enabled: true }).length;
		const totalFailed =
			isInitialized && manager?.get({ disabled: true }).filter((app: any) => app.status !== AppStatus.MANUALLY_DISABLED).length;

		return {
			totalInstalled: totalInstalled ?? false,
			totalActive: totalActive ?? false,
			totalFailed: totalFailed ?? false,
		};
	}
}
