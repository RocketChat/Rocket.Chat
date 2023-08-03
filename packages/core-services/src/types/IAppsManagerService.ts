import type { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { IApiEndpointMetadata } from '@rocket.chat/apps-engine/definition/api';
import type { IPermission } from '@rocket.chat/apps-engine/definition/permissions/IPermission';
import type { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import type {
	ISlashCommandPreview,
	ISlashCommandPreviewItem,
	SlashCommandContext,
} from '@rocket.chat/apps-engine/definition/slashcommands';
import type { IUIActionButton } from '@rocket.chat/apps-engine/definition/ui';
import type { IAppInstallParameters, IAppUninstallParameters } from '@rocket.chat/apps-engine/server/AppManager';
import type { IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';

import type { AppsEngineAppResult } from './IAppsEngineService';

export type AppFabricationFulfillment = {
	appId: string;
	appsEngineResult: AppsEngineAppResult;
	storageError: string;
	licenseValidationResult: {
		errors: Record<string, string>;
		warnings: Record<string, string>;
	};
	appUserError: {
		username: string;
		message: string;
	};
};

export interface IAppsManagerService {
	add(appPackage: Buffer, installationParameters: IAppInstallParameters): Promise<AppFabricationFulfillment | undefined>;
	remove(id: string, uninstallationParameters: IAppUninstallParameters): Promise<AppsEngineAppResult | undefined>;
	removeLocal(id: string): Promise<void>;
	update(appPackage: Buffer, permissionsGranted: Array<IPermission>, updateOptions?: any): Promise<AppFabricationFulfillment | undefined>;
	updateLocal(stored: IAppStorageItem, appPackageOrInstance: Buffer): Promise<void>;
	enable(appId: string): Promise<boolean | undefined>;
	disable(appId: string): Promise<boolean | undefined>;
	loadOne(appId: string): Promise<AppsEngineAppResult | undefined>;
	getOneById(appId: string): Promise<AppsEngineAppResult | undefined>;
	getAllActionButtons(): Promise<IUIActionButton[]>;
	updateAppSetting(appId: string, setting: ISetting): Promise<void>;
	getAppSettings(appId: string): Promise<{ [key: string]: ISetting } | undefined>;
	listApis(appId: string): Promise<Array<IApiEndpointMetadata> | undefined>;
	changeStatus(appId: string, status: AppStatus): Promise<AppsEngineAppResult | undefined>;
	getCommandPreviews(command: string, context: SlashCommandContext): Promise<ISlashCommandPreview | undefined>;
	commandExecutePreview(
		command: string,
		previewItem: ISlashCommandPreviewItem,
		context: SlashCommandContext,
	): Promise<ISlashCommandPreview | undefined>;
	commandExecuteCommand(command: string, context: SlashCommandContext): Promise<void>;
}
