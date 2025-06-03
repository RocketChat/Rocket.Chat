import type { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import type { IGetAppsFilter } from '@rocket.chat/apps-engine/server/IGetAppsFilter';
import type { IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';

export type AppStatusReport = {
	[appId: string]: { instanceId: string; status: AppStatus }[];
};

export interface IAppsEngineService {
	isInitialized(): boolean;
	getApps(query: IGetAppsFilter): Promise<IAppInfo[] | undefined>;
	getAppStorageItemById(appId: string): Promise<IAppStorageItem | undefined>;
	getAppsStatusLocal(): Promise<{ appId: string; status: AppStatus }[]>;
	getAppsStatusInNodes(): Promise<AppStatusReport>;
}
