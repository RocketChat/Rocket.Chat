import type { IGetAppsFilter } from '@rocket.chat/apps/dist/server/IGetAppsFilter';
import type { IAppStorageItem } from '@rocket.chat/apps/dist/server/storage';
import type { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';

export type AppStatusReport = {
	[appId: string]: { instanceId: string; isLocal: boolean; status: AppStatus }[];
};

export interface IAppsEngineService {
	isInitialized(): boolean;
	getApps(query: IGetAppsFilter): Promise<IAppInfo[] | undefined>;
	getAppStorageItemById(appId: string): Promise<IAppStorageItem | undefined>;
	getAppsStatusLocal(): Promise<{ appId: string; status: AppStatus }[]>;
	getAppsStatusInNodes(): Promise<AppStatusReport>;
}
