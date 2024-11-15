import { Buffer } from 'buffer';
import type { IGetAppsFilter } from './IGetAppsFilter';
import { ProxiedApp } from './ProxiedApp';
import { AppBridges } from './bridges';
import { AppStatus } from '../definition/AppStatus';
import type { IPermission } from '../definition/permissions/IPermission';
import type { IUser } from '../definition/users';
import { AppCompiler, AppFabricationFulfillment, AppPackageParser } from './compiler';
import { AppAccessorManager, AppApiManager, AppExternalComponentManager, AppLicenseManager, AppListenerManager, AppSchedulerManager, AppSettingsManager, AppSlashCommandManager, AppVideoConfProviderManager } from './managers';
import { AppRuntimeManager } from './managers/AppRuntimeManager';
import { AppSignatureManager } from './managers/AppSignatureManager';
import { UIActionButtonManager } from './managers/UIActionButtonManager';
import type { IMarketplaceInfo } from './marketplace';
import type { IAppStorageItem } from './storage';
import { AppLogStorage, AppMetadataStorage } from './storage';
import { AppSourceStorage } from './storage/AppSourceStorage';
export interface IAppInstallParameters {
    enable: boolean;
    marketplaceInfo?: IMarketplaceInfo;
    permissionsGranted?: Array<IPermission>;
    user: IUser;
}
export interface IAppUninstallParameters {
    user: IUser;
}
export interface IAppManagerDeps {
    metadataStorage: AppMetadataStorage;
    logStorage: AppLogStorage;
    bridges: AppBridges;
    sourceStorage: AppSourceStorage;
}
export declare class AppManager {
    static Instance: AppManager;
    private readonly apps;
    private readonly appMetadataStorage;
    private appSourceStorage;
    private readonly logStorage;
    private readonly bridges;
    private readonly parser;
    private readonly compiler;
    private readonly accessorManager;
    private readonly listenerManager;
    private readonly commandManager;
    private readonly apiManager;
    private readonly externalComponentManager;
    private readonly settingsManager;
    private readonly licenseManager;
    private readonly schedulerManager;
    private readonly uiActionButtonManager;
    private readonly videoConfProviderManager;
    private readonly signatureManager;
    private readonly runtime;
    private isLoaded;
    constructor({ metadataStorage, logStorage, bridges, sourceStorage }: IAppManagerDeps);
    /** Gets the instance of the storage connector. */
    getStorage(): AppMetadataStorage;
    /** Gets the instance of the log storage connector. */
    getLogStorage(): AppLogStorage;
    /** Gets the instance of the App package parser. */
    getParser(): AppPackageParser;
    /** Gets the compiler instance. */
    getCompiler(): AppCompiler;
    /** Gets the accessor manager instance. */
    getAccessorManager(): AppAccessorManager;
    /** Gets the instance of the Bridge manager. */
    getBridges(): AppBridges;
    /** Gets the instance of the listener manager. */
    getListenerManager(): AppListenerManager;
    /** Gets the command manager's instance. */
    getCommandManager(): AppSlashCommandManager;
    getVideoConfProviderManager(): AppVideoConfProviderManager;
    getLicenseManager(): AppLicenseManager;
    /** Gets the api manager's instance. */
    getApiManager(): AppApiManager;
    /** Gets the external component manager's instance. */
    getExternalComponentManager(): AppExternalComponentManager;
    /** Gets the manager of the settings, updates and getting. */
    getSettingsManager(): AppSettingsManager;
    getSchedulerManager(): AppSchedulerManager;
    getUIActionButtonManager(): UIActionButtonManager;
    getSignatureManager(): AppSignatureManager;
    getRuntime(): AppRuntimeManager;
    /** Gets whether the Apps have been loaded or not. */
    areAppsLoaded(): boolean;
    setSourceStorage(storage: AppSourceStorage): void;
    /**
     * Goes through the entire loading up process.
     * Expect this to take some time, as it goes through a very
     * long process of loading all the Apps up.
     */
    load(): Promise<boolean>;
    enableAll(): Promise<Array<AppFabricationFulfillment>>;
    unload(isManual: boolean): Promise<void>;
    /** Gets the Apps which match the filter passed in. */
    get(filter?: IGetAppsFilter): Promise<ProxiedApp[]>;
    /** Gets a single App by the id passed in. */
    getOneById(appId: string): ProxiedApp;
    getPermissionsById(appId: string): Array<IPermission>;
    enable(id: string): Promise<boolean>;
    disable(id: string, status?: AppStatus, silent?: boolean): Promise<boolean>;
    migrate(id: string): Promise<boolean>;
    addLocal(appId: string): Promise<void>;
    add(appPackage: Buffer, installationParameters: IAppInstallParameters): Promise<AppFabricationFulfillment>;
    /**
     * Uninstalls specified app from the server and remove
     * all database records regarding it
     *
     * @returns the instance of the removed ProxiedApp
     */
    remove(id: string, uninstallationParameters: IAppUninstallParameters): Promise<ProxiedApp>;
    /**
     * Removes the app instance from the local Apps container
     * and every type of data associated with it
     */
    removeLocal(id: string): Promise<void>;
    update(appPackage: Buffer, permissionsGranted: Array<IPermission>, updateOptions?: {
        loadApp?: boolean;
        user?: IUser;
    }): Promise<AppFabricationFulfillment>;
    /**
     * Updates the local instance of an app.
     *
     * If the second parameter is a Buffer of an app package,
     * unpackage and instantiate the app's main class
     *
     * With an instance of a ProxiedApp, start it up and replace
     * the reference in the local app collection
     */
    updateLocal(stored: IAppStorageItem, appPackageOrInstance: ProxiedApp | Buffer): Promise<ProxiedApp>;
    updateAndStartupLocal(stored: IAppStorageItem, appPackageOrInstance: ProxiedApp | Buffer): Promise<void>;
    updateAndInitializeLocal(stored: IAppStorageItem, appPackageOrInstance: ProxiedApp | Buffer): Promise<void>;
    getLanguageContent(): {
        [key: string]: object;
    };
    changeStatus(appId: string, status: AppStatus): Promise<ProxiedApp>;
    updateAppsMarketplaceInfo(appsOverview: Array<{
        latest: IMarketplaceInfo;
    }>): Promise<void>;
    /**
     * Goes through the entire loading up process.
     *
     * @param appId the id of the application to load
     */
    loadOne(appId: string, silenceStatus?: boolean): Promise<ProxiedApp>;
    private runStartUpProcess;
    private installApp;
    private updateApp;
    private initializeApp;
    private purgeAppConfig;
    /**
     * Determines if the App's required settings are set or not.
     * Should a packageValue be provided and not empty, then it's considered set.
     */
    private areRequiredSettingsSet;
    private enableApp;
    private createAppUser;
    private removeAppUser;
    private uninstallApp;
}
export declare const getPermissionsByAppId: (appId: string) => IPermission[];
