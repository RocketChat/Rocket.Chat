import type { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import type { IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';

export interface IAppsEngineService {
	isInitialized(): boolean;
	getApp(query: any): Promise<IAppInfo[] | undefined>;
	getAppStorageItemById(appId: string): Promise<IAppStorageItem | undefined>;
}
