import type { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { IApiEndpointMetadata } from '@rocket.chat/apps-engine/definition/api';
import type { IPermission } from '@rocket.chat/apps-engine/definition/permissions/IPermission';
import type { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import type {
	SlashCommandContext,
	ISlashCommandPreview,
	ISlashCommandPreviewItem,
} from '@rocket.chat/apps-engine/definition/slashcommands';
import type { IUIActionButton } from '@rocket.chat/apps-engine/definition/ui';
import type { IAppInstallParameters, IAppUninstallParameters } from '@rocket.chat/apps-engine/server/AppManager';
import type { IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';
import { ServiceClass } from '@rocket.chat/core-services';
import type { AppFabricationFulfillment, AppsEngineAppResult, IAppsManagerService } from '@rocket.chat/core-services';

import type { AppServerOrchestrator } from '../orchestrator';
import { transformAppFabricationFulfillment } from './lib/transformAppFabricationFulfillment';
import { transformProxiedAppToAppResult } from './lib/transformProxiedAppToAppResult';
import { OrchestratorFactory } from './orchestratorFactory';

export class AppsManagerService extends ServiceClass implements IAppsManagerService {
	protected name = 'apps-manager';

	private apps: AppServerOrchestrator;

	constructor() {
		super();

		this.apps = OrchestratorFactory.getOrchestrator();
	}

	async loadOne(appId: string): Promise<AppsEngineAppResult | undefined> {
		return this.apps.getManager()?.loadOne(appId).then(transformProxiedAppToAppResult);
	}

	async enable(appId: string): Promise<boolean | undefined> {
		return this.apps.getManager()?.enable(appId);
	}

	async disable(appId: string): Promise<boolean | undefined> {
		return this.apps.getManager()?.disable(appId);
	}

	async add(appPackage: Buffer, installationParameters: IAppInstallParameters): Promise<AppFabricationFulfillment | undefined> {
		return this.apps.getManager()?.add(appPackage, installationParameters).then(transformAppFabricationFulfillment);
	}

	async remove(id: string, uninstallationParameters: IAppUninstallParameters): Promise<AppsEngineAppResult | undefined> {
		return this.apps.getManager()?.remove(id, uninstallationParameters).then(transformProxiedAppToAppResult);
	}

	async removeLocal(id: string): Promise<void> {
		return this.apps.getManager()?.removeLocal(id);
	}

	async update(
		appPackage: Buffer,
		permissionsGranted: IPermission[],
		updateOptions = { loadApp: true },
	): Promise<AppFabricationFulfillment | undefined> {
		return this.apps.getManager()?.update(appPackage, permissionsGranted, updateOptions).then(transformAppFabricationFulfillment);
	}

	async updateLocal(stored: IAppStorageItem, appPackageOrInstance: Buffer): Promise<void> {
		return this.apps.getManager()?.updateLocal(stored, appPackageOrInstance);
	}

	async getOneById(appId: string): Promise<AppsEngineAppResult | undefined> {
		return transformProxiedAppToAppResult(this.apps.getManager()?.getOneById(appId));
	}

	async updateAppSetting(appId: string, setting: ISetting): Promise<void> {
		return this.apps.getManager()?.getSettingsManager().updateAppSetting(appId, setting);
	}

	async getAppSettings(appId: string): Promise<Record<string, ISetting> | undefined> {
		return this.apps.getManager()?.getSettingsManager().getAppSettings(appId);
	}

	async listApis(appId: string): Promise<IApiEndpointMetadata[] | undefined> {
		return this.apps.getManager()?.getApiManager().listApis(appId);
	}

	async changeStatus(appId: string, status: AppStatus): Promise<AppsEngineAppResult | undefined> {
		return this.apps.getManager()?.changeStatus(appId, status).then(transformProxiedAppToAppResult);
	}

	async getAllActionButtons(): Promise<IUIActionButton[]> {
		return this.apps.getManager()?.getUIActionButtonManager().getAllActionButtons() ?? [];
	}

	async getCommandPreviews(command: string, context: SlashCommandContext): Promise<ISlashCommandPreview | undefined> {
		return this.apps.getManager()?.getCommandManager().getPreviews(command, context);
	}

	async commandExecutePreview(
		command: string,
		previewItem: ISlashCommandPreviewItem,
		context: SlashCommandContext,
	): Promise<ISlashCommandPreview | undefined> {
		return this.apps.getManager()?.getCommandManager().executePreview(command, previewItem, context);
	}

	async commandExecuteCommand(command: string, context: SlashCommandContext): Promise<void> {
		return this.apps.getManager()?.getCommandManager().executeCommand(command, context);
	}
}
