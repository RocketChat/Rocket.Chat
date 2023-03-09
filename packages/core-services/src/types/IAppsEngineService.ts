import type { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import type { IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';
import type { IGetAppsFilter } from '@rocket.chat/apps-engine/server/IGetAppsFilter';

export interface IAppsEngineService {
	isInitialized(): boolean;
	getApps(query: IGetAppsFilter): Promise<IAppInfo[] | undefined>;
	getAppStorageItemById(appId: string): Promise<IAppStorageItem | undefined>;
}
