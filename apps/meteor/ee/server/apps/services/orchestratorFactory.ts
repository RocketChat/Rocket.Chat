import type { Db } from 'mongodb';

import { settings } from '../../../../app/settings/server';
import type { AppServerOrchestrator } from '../orchestrator';
import { Apps } from '../orchestrator';

type AppsInitParams = {
	appsSourceStorageFilesystemPath: any;
	appsSourceStorageType: any;
	marketplaceUrl?: string | undefined;
};

export class OrchestratorFactory {
	private static orchestrator: AppServerOrchestrator = Apps;

	private static createOrchestrator(_db: Db) {
		const appsInitParams: AppsInitParams = {
			appsSourceStorageType: settings.get('Apps_Framework_Source_Package_Storage_Type'),
			appsSourceStorageFilesystemPath: settings.get('Apps_Framework_Source_Package_Storage_FileSystem_Path'),
			marketplaceUrl: 'https://marketplace.rocket.chat',
		};

		// this.orchestrator = new AppServerOrchestrator(db);

		const { OVERWRITE_INTERNAL_MARKETPLACE_URL } = process.env || {};

		if (typeof OVERWRITE_INTERNAL_MARKETPLACE_URL === 'string' && OVERWRITE_INTERNAL_MARKETPLACE_URL.length > 0) {
			appsInitParams.marketplaceUrl = OVERWRITE_INTERNAL_MARKETPLACE_URL;
		}

		// this.orchestrator.initialize(appsInitParams);
	}

	public static getOrchestrator(db?: Db) {
		if (!this.orchestrator) {
			if (!db) {
				throw new Error('The database connection is required to initialize the Apps Engine Orchestrator.');
			}

			this.createOrchestrator(db);
		}

		return this.orchestrator;
	}
}
