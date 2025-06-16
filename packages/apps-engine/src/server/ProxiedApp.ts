import * as mem from 'mem';

import type { AppManager } from './AppManager';
import { AppStatus } from '../definition/AppStatus';
import { AppDesiredStatus } from '../definition/AppDesiredStatus';
import { AppsEngineException } from '../definition/exceptions';
import type { IAppAuthorInfo, IAppInfo } from '../definition/metadata';
import { AppMethod } from '../definition/metadata';
import { InvalidInstallationError } from './errors/InvalidInstallationError';
import { AppConsole } from './logging';
import { AppLicenseValidationResult } from './marketplace/license';
import type { AppsEngineRuntime } from './runtime/AppsEngineRuntime';
import { JSONRPC_METHOD_NOT_FOUND, type DenoRuntimeSubprocessController } from './runtime/deno/AppsEngineDenoRuntime';
import type { AppInstallationSource, IAppStorageItem } from './storage';
import { AppStatusMigration } from './storage/AppStatusMigration';

export class ProxiedApp {
	private previousStatus: AppStatus;

	private latestLicenseValidationResult: AppLicenseValidationResult;

	constructor(
		private readonly manager: AppManager,
		private storageItem: IAppStorageItem,
		private readonly appRuntime: DenoRuntimeSubprocessController,
	) {
		this.previousStatus = storageItem.status;

		this.appRuntime.on('processExit', () => mem.clear(this.getStatus));
	}

	public getRuntime(): AppsEngineRuntime {
		return this.manager.getRuntime();
	}

	public getDenoRuntime(): DenoRuntimeSubprocessController {
		return this.appRuntime;
	}

	public getStorageItem(): IAppStorageItem {
		return this.storageItem;
	}

	public setStorageItem(item: IAppStorageItem): void {
		this.storageItem = item;
	}

	public getPreviousStatus(): AppStatus {
		return this.previousStatus;
	}

	public getImplementationList(): { [inter: string]: boolean } {
		return this.storageItem.implemented;
	}

	public setupLogger(method: `${AppMethod}`): AppConsole {
		const logger = new AppConsole(method);

		return logger;
	}

	// We'll need to refactor this method to remove the rest parameters so we can pass an options parameter
	public async call(method: `${AppMethod}`, ...args: Array<any>): Promise<any> {
		let options;

		try {
			return await this.appRuntime.sendRequest({ method: `app:${method}`, params: args }, options);
		} catch (e) {
			if (e.code === AppsEngineException.JSONRPC_ERROR_CODE) {
				throw new AppsEngineException(e.message);
			}

			if (e.code === JSONRPC_METHOD_NOT_FOUND) {
				throw e;
			}

			// We cannot throw this error as the previous implementation swallowed those
			// and since the server is not prepared to handle those we might crash it if we throw
			// Range of JSON-RPC error codes: https://www.jsonrpc.org/specification#error_object
			if (e.code >= -32999 || e.code <= -32000) {
				// we really need to receive a logger from rocket.chat
				console.error('JSON-RPC error received: ', e);
			}
		}
	}

	public getStatus = mem(() => this.appRuntime.getStatus().catch(() => AppStatus.UNKNOWN), { maxAge: 1000 * 60 * 5 });

	public async setStatus(status: AppStatus, silent?: boolean): Promise<void> {
		await this.call(AppMethod.SETSTATUS, status);
		mem.clear(this.getStatus);
		if (!silent) {
			await this.manager.getBridges().getAppActivationBridge().doAppStatusChanged(this, status);
		}
	}

	/**
	 * Gets the desired status of the app (what administrators want)
	 */
	public getDesiredStatus(): AppDesiredStatus {
		// Migrate legacy status if needed
		if (AppStatusMigration.needsMigration(this.storageItem)) {
			AppStatusMigration.migrateLegacyStatus(this.storageItem);
		}
		return this.storageItem.desiredStatus;
	}

	/**
	 * Gets the actual runtime initialization status of the app
	 */
	public async getInitStatus(): Promise<AppStatus> {
		return this.getStatus();
	}

	/**
	 * Sets the initialization status (runtime state) of the app
	 * This should be called by the apps engine during runtime operations
	 */
	public async setInitStatus(status: AppStatus, silent?: boolean): Promise<void> {
		this.storageItem.initStatus = status;
		this.storageItem.status = status; // Keep legacy field in sync
		await this.setStatus(status, silent);
	}

	/**
	 * Sets the desired status (administrative intent) of the app
	 * This should be called by administrative actions
	 */
	public async setDesiredStatus(desiredStatus: AppDesiredStatus): Promise<void> {
		this.storageItem.desiredStatus = desiredStatus;
		// Update storage asynchronously
		await this.manager.getStorage().update(this.storageItem).catch((e) => {
			console.warn(`Failed to update desired status for app "${this.getName()}":`, e);
		});
	}

	/**
	 * Checks if the app's current state matches its desired state
	 */
	public async isInDesiredState(): Promise<boolean> {
		const currentStatus = await this.getStatus();
		const desiredStatus = this.getDesiredStatus();

		switch (desiredStatus) {
			case AppDesiredStatus.ENABLED:
				return currentStatus === AppStatus.AUTO_ENABLED || currentStatus === AppStatus.MANUALLY_ENABLED;
			case AppDesiredStatus.DISABLED:
				return currentStatus === AppStatus.MANUALLY_DISABLED || 
				       currentStatus === AppStatus.DISABLED ||
				       currentStatus === AppStatus.COMPILER_ERROR_DISABLED ||
				       currentStatus === AppStatus.ERROR_DISABLED ||
				       currentStatus === AppStatus.INVALID_LICENSE_DISABLED ||
				       currentStatus === AppStatus.INVALID_INSTALLATION_DISABLED ||
				       currentStatus === AppStatus.INVALID_SETTINGS_DISABLED;
			case AppDesiredStatus.UNINSTALLED:
				return false; // If the app exists, it's not uninstalled
			default:
				return false;
		}
	}

	public getName(): string {
		return this.storageItem.info.name;
	}

	public getNameSlug(): string {
		return this.storageItem.info.nameSlug;
	}

	// @deprecated This method will be removed in the next major version
	public getAppUserUsername(): string {
		return `${this.storageItem.info.nameSlug}.bot`;
	}

	public getID(): string {
		return this.storageItem.id;
	}

	public getInstallationSource(): AppInstallationSource {
		return this.storageItem.installationSource;
	}

	public getVersion(): string {
		return this.storageItem.info.version;
	}

	public getDescription(): string {
		return this.storageItem.info.description;
	}

	public getRequiredApiVersion(): string {
		return this.storageItem.info.requiredApiVersion;
	}

	public getAuthorInfo(): IAppAuthorInfo {
		return this.storageItem.info.author;
	}

	public getInfo(): IAppInfo {
		return this.storageItem.info;
	}

	public getEssentials(): IAppInfo['essentials'] {
		return this.getInfo().essentials;
	}

	public getLatestLicenseValidationResult(): AppLicenseValidationResult {
		return this.latestLicenseValidationResult;
	}

	public async validateInstallation(): Promise<void> {
		try {
			await this.manager.getSignatureManager().verifySignedApp(this.getStorageItem());
		} catch (e) {
			throw new InvalidInstallationError(e.message);
		}
	}

	public validateLicense(): Promise<void> {
		const { marketplaceInfo } = this.getStorageItem();

		this.latestLicenseValidationResult = new AppLicenseValidationResult();

		return this.manager.getLicenseManager().validate(this.latestLicenseValidationResult, marketplaceInfo);
	}
}
