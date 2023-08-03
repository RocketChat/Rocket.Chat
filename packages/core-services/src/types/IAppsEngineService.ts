import type { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { IExternalComponent } from '@rocket.chat/apps-engine/definition/externalComponent';
import type { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import type { IGetAppsFilter } from '@rocket.chat/apps-engine/server/IGetAppsFilter';
import type { IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';

export type AppsEngineAppResult = {
	appId: string;
	currentStatus: AppStatus;
	storageItem: IAppStorageItem;
	// latestValidationResult?: Pick<AppLicenseValidationResult, ''>;
};
export interface IAppsEngineService {
	getApps(query: IGetAppsFilter): Promise<AppsEngineAppResult[] | undefined>;
	getAppStorageItemById(appId: string): Promise<IAppStorageItem | undefined>;
	triggerEvent: (event: string, ...payload: any) => Promise<unknown>;
	updateAppsMarketplaceInfo: (apps: Array<IAppInfo>) => Promise<AppsEngineAppResult[] | undefined>;
	load: () => Promise<void>;
	unload: () => Promise<void>;
	isLoaded: () => Promise<boolean>;
	isInitialized: () => Promise<boolean>;
	getMarketplaceUrl: () => Promise<string>;
	getProvidedComponents: () => Promise<IExternalComponent[]>;
	fetchAppSourceStorage(storageItem: IAppStorageItem): Promise<Buffer | undefined>;
	setStorage(value: string): Promise<void>;
	setFileSystemStoragePath(value: string): Promise<void>;
}
