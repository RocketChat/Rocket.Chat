import type { IApiEndpointMetadata } from '@rocket.chat/apps-engine/definition/api';
import type { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import type { ProxiedApp } from '@rocket.chat/apps-engine/server/ProxiedApp';
import type { IPermission } from '@rocket.chat/apps-engine/definition/permissions/IPermission';
import type { AppFabricationFulfillment } from '@rocket.chat/apps-engine/server/compiler';
import type { IAppInstallParameters, IAppUninstallParameters } from '@rocket.chat/apps-engine/server/AppManager';
import type { IGetAppsFilter } from '@rocket.chat/apps-engine/server/IGetAppsFilter';
import type { IUIActionButton } from '@rocket.chat/apps-engine/definition/ui';
import type { IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';

import { ServiceClass } from '../../../server/sdk/types/ServiceClass';
import type { AppServerOrchestrator } from './orchestrator';
import { OrchestratorFactory } from './orchestratorFactory';
import type { IAppsManagerService } from '../../../server/sdk/types/IAppsManagerService';

export class AppsManagerService extends ServiceClass implements IAppsManagerService {
	protected name = 'apps';

	private apps: AppServerOrchestrator;

	constructor() {
		super();
		this.apps = OrchestratorFactory.getOrchestrator();
	}

	async loadOne(appId: string): Promise<ProxiedApp | undefined> {
		return (this.apps.getManager() as any).loadOne(appId); // TO-DO: fix type
	}

	async enable(appId: string): Promise<boolean | undefined> {
		return this.apps.getManager()?.enable(appId);
	}

	async disable(appId: string): Promise<boolean | undefined> {
		return this.apps.getManager()?.disable(appId);
	}

	get(filter?: IGetAppsFilter | undefined): ProxiedApp[] {
		return this.apps.getManager()?.get(filter) ?? [];
	}

	async add(appPackage: Buffer, installationParameters: IAppInstallParameters): Promise<AppFabricationFulfillment | undefined> {
		return this.apps.getManager()?.add(appPackage, installationParameters);
	}

	async remove(id: string, uninstallationParameters: IAppUninstallParameters): Promise<ProxiedApp | undefined> {
		return this.apps.getManager()?.remove(id, uninstallationParameters);
	}

	async removeLocal(id: string): Promise<void> {
		return this.apps.getManager()?.removeLocal(id);
	}

	async update(
		appPackage: Buffer,
		permissionsGranted: IPermission[],
		updateOptions = { loadApp: true },
	): Promise<AppFabricationFulfillment | undefined> {
		return this.apps.getManager()?.update(appPackage, permissionsGranted, updateOptions);
	}

	async updateLocal(stored: IAppStorageItem, appPackageOrInstance: ProxiedApp | Buffer): Promise<void> {
		this.apps.getManager()?.updateLocal(stored, appPackageOrInstance);
	}

	getOneById(appId: string): ProxiedApp | undefined {
		return this.apps.getManager()?.getOneById(appId);
	}

	async updateAppSetting(appId: string, setting: ISetting): Promise<void> {
		return this.apps.getManager()?.getSettingsManager().updateAppSetting(appId, setting);
	}

	getAppSettings(appId: string): { [key: string]: ISetting } | undefined {
		return this.apps.getManager()?.getSettingsManager().getAppSettings(appId);
	}

	listApis(appId: string): IApiEndpointMetadata[] | undefined {
		return this.apps.getManager()?.getApiManager().listApis(appId);
	}

	async changeStatus(appId: string, status: AppStatus): Promise<ProxiedApp | undefined> {
		return this.apps.getManager()?.changeStatus(appId, status);
	}

	getAllActionButtons(): IUIActionButton[] {
		return this.apps.getManager()?.getUIActionButtonManager().getAllActionButtons() ?? [];
	}
}
