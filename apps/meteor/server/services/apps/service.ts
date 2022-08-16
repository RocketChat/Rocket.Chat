import { settings } from '../../../app/settings/server';
import { ServiceClass } from '../../sdk/types/ServiceClass';
import { AppServerOrchestrator } from './orchestrator';

export class AppsOrchestratorService extends ServiceClass {
	protected name = 'apps';

	private apps: AppServerOrchestrator;

	constructor() {
		super();

		this.apps = new AppServerOrchestrator();

		const appsInitParams = {
			appsSourceStorageType: settings.get('Apps_Framework_Source_Package_Storage_Type'),
			appsSourceStorageFilesystemPath: settings.get('Apps_Framework_Source_Package_Storage_FileSystem_Path'),
			marketplaceUrl: 'https://marketplace.rocket.chat',
		};

		const { OVERWRITE_INTERNAL_MARKETPLACE_URL } = process.env || {};

		if (typeof OVERWRITE_INTERNAL_MARKETPLACE_URL === 'string' && OVERWRITE_INTERNAL_MARKETPLACE_URL.length > 0) {
			appsInitParams.marketplaceUrl = OVERWRITE_INTERNAL_MARKETPLACE_URL;
		}

		this.apps.initialize(appsInitParams);
	}

	async started(): Promise<void> {
		if (!this.apps.isEnabled()) {
			return;
		}

		this.apps.load();
	}
}
