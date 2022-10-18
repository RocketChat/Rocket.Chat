import type { IApiEndpointMetadata } from '@rocket.chat/apps-engine/definition/api';
import type { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { IPermission } from '@rocket.chat/apps-engine/definition/permissions/IPermission';
import type { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import type { IUIActionButton } from '@rocket.chat/apps-engine/definition/ui';
import type { IAppInstallParameters, IAppUninstallParameters } from '@rocket.chat/apps-engine/server/AppManager';
import type { AppFabricationFulfillment } from '@rocket.chat/apps-engine/server/compiler';
import type { IGetAppsFilter } from '@rocket.chat/apps-engine/server/IGetAppsFilter';
import type { ProxiedApp } from '@rocket.chat/apps-engine/server/ProxiedApp';
import type { IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';

export interface IAppsManagerService {
	get(filter?: IGetAppsFilter): Array<ProxiedApp | undefined>;
	add(appPackage: Buffer, installationParameters: IAppInstallParameters): Promise<AppFabricationFulfillment | undefined>;
	remove(id: string, uninstallationParameters: IAppUninstallParameters): Promise<ProxiedApp | undefined>;
	removeLocal(id: string): Promise<void>;
	update(appPackage: Buffer, permissionsGranted: Array<IPermission>, updateOptions?: any): Promise<AppFabricationFulfillment | undefined>;
	updateLocal(stored: IAppStorageItem, appPackageOrInstance: ProxiedApp | Buffer): Promise<void>;
	enable(appId: string): Promise<boolean | undefined>;
	disable(appId: string): Promise<boolean | undefined>;
	loadOne(appId: string): Promise<ProxiedApp | undefined>;
	getOneById(appId: string): ProxiedApp | undefined;
	getAllActionButtons(): IUIActionButton[];
	updateAppSetting(appId: string, setting: ISetting): Promise<void>;
	getAppSettings(appId: string): { [key: string]: ISetting } | undefined;
	listApis(appId: string): Array<IApiEndpointMetadata> | undefined;
	changeStatus(appId: string, status: AppStatus): Promise<ProxiedApp | undefined>;
}
