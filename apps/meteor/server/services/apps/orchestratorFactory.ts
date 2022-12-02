import type { Db } from 'mongodb';

import { AppServerOrchestrator } from './orchestrator';
import { addAppsSettings, watchAppsSettingsChanges } from './settings';
import { settings } from '../../../app/settings/server';

type AppsInitParams = {
	appsSourceStorageFilesystemPath: any;
	appsSourceStorageType: any;
	marketplaceUrl?: string | undefined;
};

export class OrchestratorFactory {
	private static orchestrator: AppServerOrchestrator;

	private static createOrchestrator(db?: Db) {
		const appsInitParams: AppsInitParams = {
			appsSourceStorageType: settings.get('Apps_Framework_Source_Package_Storage_Type'),
			appsSourceStorageFilesystemPath: settings.get('Apps_Framework_Source_Package_Storage_FileSystem_Path'),
			marketplaceUrl: 'https://marketplace.rocket.chat',
		};

		addAppsSettings();

		this.orchestrator = new AppServerOrchestrator(db);

		const { OVERWRITE_INTERNAL_MARKETPLACE_URL } = process.env || {};

		if (typeof OVERWRITE_INTERNAL_MARKETPLACE_URL === 'string' && OVERWRITE_INTERNAL_MARKETPLACE_URL.length > 0) {
			appsInitParams.marketplaceUrl = OVERWRITE_INTERNAL_MARKETPLACE_URL;
		}

		this.orchestrator.initialize(appsInitParams);

		watchAppsSettingsChanges(this.orchestrator);
	}

	public static getOrchestrator(db?: Db) {
		if (!this.orchestrator) {
			this.createOrchestrator(db);
		}

		return this.orchestrator;
	}
}
