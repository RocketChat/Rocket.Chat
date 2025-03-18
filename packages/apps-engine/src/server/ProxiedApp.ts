import * as mem from 'mem';

import type { AppManager } from './AppManager';
import { AppStatus } from '../definition/AppStatus';
import { AppsEngineException } from '../definition/exceptions';
import type { IAppAuthorInfo, IAppInfo } from '../definition/metadata';
import { AppMethod } from '../definition/metadata';
import { InvalidInstallationError } from './errors/InvalidInstallationError';
import { AppConsole } from './logging';
import { AppLicenseValidationResult } from './marketplace/license';
import type { AppsEngineRuntime } from './runtime/AppsEngineRuntime';
import { JSONRPC_METHOD_NOT_FOUND, type DenoRuntimeSubprocessController } from './runtime/deno/AppsEngineDenoRuntime';
import type { AppInstallationSource, IAppStorageItem } from './storage';

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
