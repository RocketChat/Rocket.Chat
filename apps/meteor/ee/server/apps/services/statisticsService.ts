import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import { ServiceClass } from '@rocket.chat/core-services';
import type { AppsStatisticsResult, IAppsStatisticsService } from '@rocket.chat/core-services';

import type { AppServerOrchestrator } from '../orchestrator';
import { OrchestratorFactory } from './orchestratorFactory';

export class AppsStatisticsService extends ServiceClass implements IAppsStatisticsService {
	protected name = 'apps-statistics';

	private apps: AppServerOrchestrator;

	constructor() {
		super();

		this.apps = OrchestratorFactory.getOrchestrator();
	}

	async getStatistics(): Promise<AppsStatisticsResult> {
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
