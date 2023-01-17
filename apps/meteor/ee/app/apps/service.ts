import type { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import type { ProxiedApp } from '@rocket.chat/apps-engine/server/ProxiedApp';
import type { SettingValue } from '@rocket.chat/core-typings';
import type { IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';
import type { Db } from 'mongodb';
import type { IExternalComponent } from '@rocket.chat/apps-engine/definition/externalComponent';
import type { IAppsPersistenceModel } from '@rocket.chat/model-typings';

import type { IAppsService } from '../../../server/sdk/types/IAppsService';
import { settings } from '../../../app/settings/server';
import { ServiceClass } from '../../../server/sdk/types/ServiceClass';
import type { AppServerOrchestrator } from './orchestrator';
import { OrchestratorFactory } from './orchestratorFactory';
import type { AppRealLogsStorage } from './storage';

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

	constructor(db: Db) {
		super();

		this.apps = OrchestratorFactory.getOrchestrator(db);
	}

	async started(): Promise<void> {
		if (!this.apps.isEnabled()) {
			return;
		}

		this.apps.load();
	}

	async triggerEvent(event: string, ...payload: any): Promise<any> {
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

	getPersistenceModel(): IAppsPersistenceModel {
		return this.apps.getPersistenceModel();
	}

	getMarketplaceUrl(): string {
		return this.apps.getMarketplaceUrl() as string;
	}

	rocketChatLoggerWarn<T>(obj: T, args: any[]) {
		return this.apps.getRocketChatLogger()?.warn(obj, args);
	}

	getProvidedComponents(): IExternalComponent[] {
		return this.apps.getProvidedComponents();
	}

	rocketChatLoggerError<T>(obj: T, args: any[]) {
		return this.apps.getRocketChatLogger()?.error(obj, args);
	}

	debugLog(...args: any[]) {
		return this.apps.debugLog(args);
	}

	async retrieveOneFromStorage(appId: string): Promise<IAppStorageItem | null> {
		return this.apps.getStorage()?.retrieveOne(appId);
	}

	fetchAppSourceStorage(storageItem: IAppStorageItem): Promise<Buffer> | undefined {
		return this.apps.getAppSourceStorage()?.fetch(storageItem);
	}

	getLogStorage(): AppRealLogsStorage | undefined {
		return this.apps.getLogStorage();
	}
}
