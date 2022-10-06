import type { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import type { ProxiedApp } from '@rocket.chat/apps-engine/server/ProxiedApp';
import type { AppManager } from '@rocket.chat/apps-engine/server/AppManager';
import type { SettingValue } from '@rocket.chat/core-typings';

import type { AppsPersistenceModel } from '../../../app/models/server';
import type { IAppsService } from '../../sdk/types/IAppsService';
import type { RealAppBridges } from './bridges';
import { addAppsSettings, watchAppsSettingsChanges } from './settings';
import { settings } from '../../../app/settings/server';
import { ServiceClass } from '../../sdk/types/ServiceClass';
import { AppServerOrchestrator } from './orchestrator';

type AppsInitParams = {
	appsSourceStorageFilesystemPath: any;
	appsSourceStorageType: any;
	marketplaceUrl?: string | undefined;
};

export class AppsOrchestratorService extends ServiceClass implements IAppsService {
	protected name = 'apps';

	private apps: AppServerOrchestrator;

	private appsInitParams: AppsInitParams = {
		appsSourceStorageType: settings.get('Apps_Framework_Source_Package_Storage_Type'),
		appsSourceStorageFilesystemPath: settings.get('Apps_Framework_Source_Package_Storage_FileSystem_Path'),
		marketplaceUrl: 'https://marketplace.rocket.chat',
	};

	constructor() {
		super();

		addAppsSettings();

		this.apps = new AppServerOrchestrator();

		const { OVERWRITE_INTERNAL_MARKETPLACE_URL } = process.env || {};

		if (typeof OVERWRITE_INTERNAL_MARKETPLACE_URL === 'string' && OVERWRITE_INTERNAL_MARKETPLACE_URL.length > 0) {
			this.appsInitParams.marketplaceUrl = OVERWRITE_INTERNAL_MARKETPLACE_URL;
		}

		this.initialize();

		watchAppsSettingsChanges(this.apps);
	}

	async started(): Promise<void> {
		if (!this.apps.isEnabled()) {
			return;
		}

		this.apps.load();
	}

	async triggerEvent(event: string, payload: Record<string, any>): Promise<any> {
		return this.apps.triggerEvent(event, payload);
	}

	async updateAppsMarketplaceInfo(apps: Array<IAppInfo>): Promise<ProxiedApp[] | undefined> {
		return this.apps.updateAppsMarketplaceInfo(apps);
	}

	initialize(): void {
		return this.apps.initialize(this.appsInitParams);
	}

	async load(): Promise<void> {
		return this.apps.load();
	}

	async unload(): Promise<void> {
		return this.apps.unload();
	}

	isLoaded(): boolean {
		return this.apps.isLoaded();
	}

	isEnabled(): SettingValue {
		return this.apps.isEnabled();
	}

	isInitialized(): boolean {
		return this.apps.isInitialized();
	}

	getBridges(): RealAppBridges | undefined {
		return this.apps.getBridges();
	}

	getManager(): AppManager | undefined {
		return this.apps.getManager();
	}

	getPersistenceModel(): AppsPersistenceModel {
		return this.apps.getPersistenceModel();
	}
}
