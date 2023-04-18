import type { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import type { ProxiedApp } from '@rocket.chat/apps-engine/server/ProxiedApp';
import type { IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';
import type { Db } from 'mongodb';
import type { IExternalComponent } from '@rocket.chat/apps-engine/definition/externalComponent';
import type { IAppsPersistenceModel } from '@rocket.chat/model-typings';
import type { IAppsService } from '@rocket.chat/core-services';
import { ServiceClass } from '@rocket.chat/core-services';

import { OrchestratorFactory } from './orchestratorFactory';
import type { AppServerOrchestrator } from '../orchestrator';

export class AppsOrchestratorService extends ServiceClass implements IAppsService {
	protected name = 'apps';

	private apps: AppServerOrchestrator;

	constructor(db: Db) {
		super();

		this.apps = OrchestratorFactory.getOrchestrator(db);
	}

	async started(): Promise<void> {
		return this.apps.load();
	}

	async triggerEvent(event: string, ...payload: any): Promise<any> {
		return this.apps.triggerEvent(event, ...payload);
	}

	async updateAppsMarketplaceInfo(apps: Array<IAppInfo>): Promise<ProxiedApp[] | undefined> {
		return this.apps.updateAppsMarketplaceInfo(apps);
	}

	initialize(): void {
		// Do we need this?
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

	retrieveOneFromStorage(appId: string): Promise<IAppStorageItem | null> {
		return this.apps.getStorage()!.retrieveOne(appId);
	}

	fetchAppSourceStorage(storageItem: IAppStorageItem): Promise<Buffer> | undefined {
		return this.apps.getAppSourceStorage()?.fetch(storageItem);
	}

	setStorage(value: string): void {
		return this.apps.getAppSourceStorage()?.setStorage(value);
	}

	setFileSystemStoragePath(value: string): void {
		return this.apps.getAppSourceStorage()?.setFileSystemStoragePath(value);
	}
}
