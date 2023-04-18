import type { IExternalComponent } from '@rocket.chat/apps-engine/definition/externalComponent';
import type { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import type { ProxiedApp } from '@rocket.chat/apps-engine/server/ProxiedApp';
import type { IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';
import type { IAppsPersistenceModel } from '@rocket.chat/model-typings';

export interface IAppsService {
	triggerEvent: (event: string, ...payload: any) => Promise<unknown>;
	updateAppsMarketplaceInfo: (apps: Array<IAppInfo>) => Promise<ProxiedApp[] | undefined>;
	load: () => Promise<void>;
	unload: () => Promise<void>;
	isLoaded: () => Promise<boolean>;
	isInitialized: () => Promise<boolean>;
	getPersistenceModel: () => Promise<IAppsPersistenceModel>;
	getMarketplaceUrl: () => Promise<string>;
	getProvidedComponents: () => Promise<IExternalComponent[]>;
	rocketChatLoggerWarn<T>(obj: T, args: any[]): Promise<void>;
	rocketChatLoggerError<T>(obj: T, args: any[]): Promise<void>;
	retrieveOneFromStorage(appId: string): Promise<IAppStorageItem | null>;
	fetchAppSourceStorage(storageItem: IAppStorageItem): Promise<Buffer | undefined>;
	setFrameworkEnabled: (value: boolean) => Promise<void>;
	setDevelopmentMode: (value: boolean) => Promise<void>;
	setStorage(value: string): Promise<void>;
	setFileSystemStoragePath(value: string): Promise<void>;
}
