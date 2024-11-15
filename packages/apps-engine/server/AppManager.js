"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPermissionsByAppId = exports.AppManager = void 0;
const buffer_1 = require("buffer");
const ProxiedApp_1 = require("./ProxiedApp");
const bridges_1 = require("./bridges");
const AppStatus_1 = require("../definition/AppStatus");
const metadata_1 = require("../definition/metadata");
const users_1 = require("../definition/users");
const compiler_1 = require("./compiler");
const errors_1 = require("./errors");
const InvalidInstallationError_1 = require("./errors/InvalidInstallationError");
const managers_1 = require("./managers");
const AppRuntimeManager_1 = require("./managers/AppRuntimeManager");
const AppSignatureManager_1 = require("./managers/AppSignatureManager");
const UIActionButtonManager_1 = require("./managers/UIActionButtonManager");
const AppPermissions_1 = require("./permissions/AppPermissions");
const storage_1 = require("./storage");
const AppSourceStorage_1 = require("./storage/AppSourceStorage");
const IAppStorageItem_1 = require("./storage/IAppStorageItem");
class AppManager {
    constructor({ metadataStorage, logStorage, bridges, sourceStorage }) {
        // Singleton style. There can only ever be one AppManager instance
        if (typeof AppManager.Instance !== 'undefined') {
            throw new Error('There is already a valid AppManager instance');
        }
        if (metadataStorage instanceof storage_1.AppMetadataStorage) {
            this.appMetadataStorage = metadataStorage;
        }
        else {
            throw new Error('Invalid instance of the AppMetadataStorage');
        }
        if (logStorage instanceof storage_1.AppLogStorage) {
            this.logStorage = logStorage;
        }
        else {
            throw new Error('Invalid instance of the AppLogStorage');
        }
        if (bridges instanceof bridges_1.AppBridges) {
            this.bridges = bridges;
        }
        else {
            throw new Error('Invalid instance of the AppBridges');
        }
        if (sourceStorage instanceof AppSourceStorage_1.AppSourceStorage) {
            this.appSourceStorage = sourceStorage;
        }
        else {
            throw new Error('Invalid instance of the AppSourceStorage');
        }
        this.apps = new Map();
        this.parser = new compiler_1.AppPackageParser();
        this.compiler = new compiler_1.AppCompiler();
        this.accessorManager = new managers_1.AppAccessorManager(this);
        this.listenerManager = new managers_1.AppListenerManager(this);
        this.commandManager = new managers_1.AppSlashCommandManager(this);
        this.apiManager = new managers_1.AppApiManager(this);
        this.externalComponentManager = new managers_1.AppExternalComponentManager();
        this.settingsManager = new managers_1.AppSettingsManager(this);
        this.licenseManager = new managers_1.AppLicenseManager(this);
        this.schedulerManager = new managers_1.AppSchedulerManager(this);
        this.uiActionButtonManager = new UIActionButtonManager_1.UIActionButtonManager(this);
        this.videoConfProviderManager = new managers_1.AppVideoConfProviderManager(this);
        this.signatureManager = new AppSignatureManager_1.AppSignatureManager(this);
        this.runtime = new AppRuntimeManager_1.AppRuntimeManager(this);
        this.isLoaded = false;
        AppManager.Instance = this;
    }
    /** Gets the instance of the storage connector. */
    getStorage() {
        return this.appMetadataStorage;
    }
    /** Gets the instance of the log storage connector. */
    getLogStorage() {
        return this.logStorage;
    }
    /** Gets the instance of the App package parser. */
    getParser() {
        return this.parser;
    }
    /** Gets the compiler instance. */
    getCompiler() {
        return this.compiler;
    }
    /** Gets the accessor manager instance. */
    getAccessorManager() {
        return this.accessorManager;
    }
    /** Gets the instance of the Bridge manager. */
    getBridges() {
        return this.bridges;
    }
    /** Gets the instance of the listener manager. */
    getListenerManager() {
        return this.listenerManager;
    }
    /** Gets the command manager's instance. */
    getCommandManager() {
        return this.commandManager;
    }
    getVideoConfProviderManager() {
        return this.videoConfProviderManager;
    }
    getLicenseManager() {
        return this.licenseManager;
    }
    /** Gets the api manager's instance. */
    getApiManager() {
        return this.apiManager;
    }
    /** Gets the external component manager's instance. */
    getExternalComponentManager() {
        return this.externalComponentManager;
    }
    /** Gets the manager of the settings, updates and getting. */
    getSettingsManager() {
        return this.settingsManager;
    }
    getSchedulerManager() {
        return this.schedulerManager;
    }
    getUIActionButtonManager() {
        return this.uiActionButtonManager;
    }
    getSignatureManager() {
        return this.signatureManager;
    }
    getRuntime() {
        return this.runtime;
    }
    /** Gets whether the Apps have been loaded or not. */
    areAppsLoaded() {
        return this.isLoaded;
    }
    setSourceStorage(storage) {
        this.appSourceStorage = storage;
    }
    /**
     * Goes through the entire loading up process.
     * Expect this to take some time, as it goes through a very
     * long process of loading all the Apps up.
     */
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            // You can not load the AppManager system again
            // if it has already been loaded.
            if (this.isLoaded) {
                return true;
            }
            const items = yield this.appMetadataStorage.retrieveAll();
            for (const item of items.values()) {
                try {
                    const appPackage = yield this.appSourceStorage.fetch(item);
                    const unpackageResult = yield this.getParser().unpackageApp(appPackage);
                    const app = yield this.getCompiler().toSandBox(this, item, unpackageResult);
                    this.apps.set(item.id, app);
                }
                catch (e) {
                    console.warn(`Error while compiling the App "${item.info.name} (${item.id})":`);
                    console.error(e);
                    const prl = new ProxiedApp_1.ProxiedApp(this, item, {
                        // Maybe we should have an "EmptyRuntime" class for this?
                        getStatus() {
                            return AppStatus_1.AppStatus.COMPILER_ERROR_DISABLED;
                        },
                    });
                    this.apps.set(item.id, prl);
                }
            }
            this.isLoaded = true;
            return true;
        });
    }
    enableAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const affs = [];
            // Let's initialize them
            for (const rl of this.apps.values()) {
                const aff = new compiler_1.AppFabricationFulfillment();
                aff.setAppInfo(rl.getInfo());
                aff.setImplementedInterfaces(rl.getImplementationList());
                aff.setApp(rl);
                affs.push(aff);
                if (AppStatus_1.AppStatusUtils.isDisabled(yield rl.getStatus())) {
                    // Usually if an App is disabled before it's initialized,
                    // then something (such as an error) occured while
                    // it was compiled or something similar.
                    // We still have to validate its license, though
                    yield rl.validateLicense();
                    continue;
                }
                yield this.initializeApp(rl.getStorageItem(), rl, false, true).catch(console.error);
            }
            // Let's ensure the required settings are all set
            for (const rl of this.apps.values()) {
                if (AppStatus_1.AppStatusUtils.isDisabled(yield rl.getStatus())) {
                    continue;
                }
                if (!this.areRequiredSettingsSet(rl.getStorageItem())) {
                    yield rl.setStatus(AppStatus_1.AppStatus.INVALID_SETTINGS_DISABLED).catch(console.error);
                }
            }
            // Now let's enable the apps which were once enabled
            // but are not currently disabled.
            for (const app of this.apps.values()) {
                const status = yield app.getStatus();
                if (!AppStatus_1.AppStatusUtils.isDisabled(status) && AppStatus_1.AppStatusUtils.isEnabled(app.getPreviousStatus())) {
                    yield this.enableApp(app.getStorageItem(), app, true, app.getPreviousStatus() === AppStatus_1.AppStatus.MANUALLY_ENABLED).catch(console.error);
                }
                else if (!AppStatus_1.AppStatusUtils.isError(status)) {
                    this.listenerManager.lockEssentialEvents(app);
                    this.uiActionButtonManager.clearAppActionButtons(app.getID());
                }
            }
            return affs;
        });
    }
    unload(isManual) {
        return __awaiter(this, void 0, void 0, function* () {
            // If the AppManager hasn't been loaded yet, then
            // there is nothing to unload
            if (!this.isLoaded) {
                return;
            }
            for (const app of this.apps.values()) {
                const status = yield app.getStatus();
                if (status === AppStatus_1.AppStatus.INITIALIZED) {
                    yield this.purgeAppConfig(app);
                }
                else if (!AppStatus_1.AppStatusUtils.isDisabled(status)) {
                    yield this.disable(app.getID(), isManual ? AppStatus_1.AppStatus.MANUALLY_DISABLED : AppStatus_1.AppStatus.DISABLED);
                }
                this.listenerManager.releaseEssentialEvents(app);
                app.getDenoRuntime().stopApp();
            }
            // Remove all the apps from the system now that we have unloaded everything
            this.apps.clear();
            this.isLoaded = false;
        });
    }
    /** Gets the Apps which match the filter passed in. */
    get(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            let rls = [];
            if (typeof filter === 'undefined') {
                this.apps.forEach((rl) => rls.push(rl));
                return rls;
            }
            let nothing = true;
            if (typeof filter.enabled === 'boolean' && filter.enabled) {
                for (const rl of this.apps.values()) {
                    if (AppStatus_1.AppStatusUtils.isEnabled(yield rl.getStatus())) {
                        rls.push(rl);
                    }
                }
                nothing = false;
            }
            if (typeof filter.disabled === 'boolean' && filter.disabled) {
                for (const rl of this.apps.values()) {
                    if (AppStatus_1.AppStatusUtils.isDisabled(yield rl.getStatus())) {
                        rls.push(rl);
                    }
                }
                nothing = false;
            }
            if (nothing) {
                this.apps.forEach((rl) => rls.push(rl));
            }
            if (typeof filter.ids !== 'undefined') {
                rls = rls.filter((rl) => filter.ids.includes(rl.getID()));
            }
            if (typeof filter.installationSource !== 'undefined') {
                rls = rls.filter((rl) => rl.getInstallationSource() === filter.installationSource);
            }
            if (typeof filter.name === 'string') {
                rls = rls.filter((rl) => rl.getName() === filter.name);
            }
            else if (filter.name instanceof RegExp) {
                rls = rls.filter((rl) => filter.name.test(rl.getName()));
            }
            return rls;
        });
    }
    /** Gets a single App by the id passed in. */
    getOneById(appId) {
        return this.apps.get(appId);
    }
    getPermissionsById(appId) {
        const app = this.apps.get(appId);
        if (!app) {
            return [];
        }
        const { permissionsGranted } = app.getStorageItem();
        return permissionsGranted || AppPermissions_1.defaultPermissions;
    }
    enable(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const rl = this.apps.get(id);
            if (!rl) {
                throw new Error(`No App by the id "${id}" exists.`);
            }
            const status = yield rl.getStatus();
            if (AppStatus_1.AppStatusUtils.isEnabled(status)) {
                return true;
            }
            if (status === AppStatus_1.AppStatus.COMPILER_ERROR_DISABLED) {
                throw new Error('The App had compiler errors, can not enable it.');
            }
            const storageItem = yield this.appMetadataStorage.retrieveOne(id);
            if (!storageItem) {
                throw new Error(`Could not enable an App with the id of "${id}" as it doesn't exist.`);
            }
            const isSetup = yield this.runStartUpProcess(storageItem, rl, true, false);
            if (isSetup) {
                storageItem.status = yield rl.getStatus();
                // This is async, but we don't care since it only updates in the database
                // and it should not mutate any properties we care about
                yield this.appMetadataStorage.update(storageItem).catch();
            }
            return isSetup;
        });
    }
    disable(id_1) {
        return __awaiter(this, arguments, void 0, function* (id, status = AppStatus_1.AppStatus.DISABLED, silent) {
            if (!AppStatus_1.AppStatusUtils.isDisabled(status)) {
                throw new Error('Invalid disabled status');
            }
            const app = this.apps.get(id);
            if (!app) {
                throw new Error(`No App by the id "${id}" exists.`);
            }
            if (AppStatus_1.AppStatusUtils.isEnabled(yield app.getStatus())) {
                yield app.call(metadata_1.AppMethod.ONDISABLE).catch((e) => console.warn('Error while disabling:', e));
            }
            yield this.purgeAppConfig(app, { keepScheduledJobs: true });
            yield app.setStatus(status, silent);
            const storageItem = yield this.appMetadataStorage.retrieveOne(id);
            app.getStorageItem().marketplaceInfo = storageItem.marketplaceInfo;
            yield app.validateLicense().catch();
            storageItem.status = yield app.getStatus();
            // This is async, but we don't care since it only updates in the database
            // and it should not mutate any properties we care about
            yield this.appMetadataStorage.update(storageItem).catch();
            return true;
        });
    }
    migrate(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const app = this.apps.get(id);
            if (!app) {
                throw new Error(`No App by the id "${id}" exists.`);
            }
            yield app.call(metadata_1.AppMethod.ONUPDATE).catch((e) => console.warn('Error while migrating:', e));
            yield this.purgeAppConfig(app, { keepScheduledJobs: true });
            const storageItem = yield this.appMetadataStorage.retrieveOne(id);
            app.getStorageItem().marketplaceInfo = storageItem.marketplaceInfo;
            yield app.validateLicense().catch();
            storageItem.migrated = true;
            storageItem.signature = yield this.getSignatureManager().signApp(storageItem);
            // This is async, but we don't care since it only updates in the database
            // and it should not mutate any properties we care about
            const stored = yield this.appMetadataStorage.update(storageItem).catch();
            yield this.updateLocal(stored, app);
            yield this.bridges
                .getAppActivationBridge()
                .doAppUpdated(app)
                .catch(() => { });
            return true;
        });
    }
    addLocal(appId) {
        return __awaiter(this, void 0, void 0, function* () {
            const storageItem = yield this.appMetadataStorage.retrieveOne(appId);
            if (!storageItem) {
                throw new Error(`App with id ${appId} couldn't be found`);
            }
            const appPackage = yield this.appSourceStorage.fetch(storageItem);
            if (!appPackage) {
                throw new Error(`Package file for app "${storageItem.info.name}" (${appId}) couldn't be found`);
            }
            const parsedPackage = yield this.getParser().unpackageApp(appPackage);
            const app = yield this.getCompiler().toSandBox(this, storageItem, parsedPackage);
            this.apps.set(app.getID(), app);
            yield this.loadOne(appId);
        });
    }
    add(appPackage, installationParameters) {
        return __awaiter(this, void 0, void 0, function* () {
            const { enable = true, marketplaceInfo, permissionsGranted, user } = installationParameters;
            const aff = new compiler_1.AppFabricationFulfillment();
            const result = yield this.getParser().unpackageApp(appPackage);
            const undoSteps = [];
            aff.setAppInfo(result.info);
            aff.setImplementedInterfaces(result.implemented.getValues());
            const descriptor = {
                id: result.info.id,
                info: result.info,
                status: AppStatus_1.AppStatus.UNKNOWN,
                settings: {},
                implemented: result.implemented.getValues(),
                installationSource: marketplaceInfo ? IAppStorageItem_1.AppInstallationSource.MARKETPLACE : IAppStorageItem_1.AppInstallationSource.PRIVATE,
                marketplaceInfo,
                permissionsGranted,
                languageContent: result.languageContent,
            };
            try {
                descriptor.sourcePath = yield this.appSourceStorage.store(descriptor, appPackage);
                undoSteps.push(() => this.appSourceStorage.remove(descriptor));
            }
            catch (error) {
                aff.setStorageError('Failed to store app package');
                return aff;
            }
            // Now that is has all been compiled, let's get the
            // the App instance from the source.
            const app = yield this.getCompiler().toSandBox(this, descriptor, result);
            undoSteps.push(() => this.getRuntime()
                .stopRuntime(app.getDenoRuntime())
                .catch(() => { }));
            // Create a user for the app
            try {
                yield this.createAppUser(result.info);
                undoSteps.push(() => this.removeAppUser(app));
            }
            catch (err) {
                aff.setAppUserError({
                    username: `${result.info.nameSlug}.bot`,
                    message: 'Failed to create an app user for this app.',
                });
                yield Promise.all(undoSteps.map((undoer) => undoer()));
                return aff;
            }
            descriptor.signature = yield this.getSignatureManager().signApp(descriptor);
            const created = yield this.appMetadataStorage.create(descriptor);
            if (!created) {
                aff.setStorageError('Failed to create the App, the storage did not return it.');
                yield Promise.all(undoSteps.map((undoer) => undoer()));
                return aff;
            }
            this.apps.set(app.getID(), app);
            aff.setApp(app);
            // Let everyone know that the App has been added
            yield this.bridges
                .getAppActivationBridge()
                .doAppAdded(app)
                .catch(() => {
                // If an error occurs during this, oh well.
            });
            yield this.installApp(created, app, user);
            // Should enable === true, then we go through the entire start up process
            // Otherwise, we only initialize it.
            if (enable) {
                // Start up the app
                yield this.runStartUpProcess(created, app, false, false);
            }
            else {
                yield this.initializeApp(created, app, true);
            }
            return aff;
        });
    }
    /**
     * Uninstalls specified app from the server and remove
     * all database records regarding it
     *
     * @returns the instance of the removed ProxiedApp
     */
    remove(id, uninstallationParameters) {
        return __awaiter(this, void 0, void 0, function* () {
            const app = this.apps.get(id);
            const { user } = uninstallationParameters;
            // First remove the app
            yield this.uninstallApp(app, user);
            yield this.removeLocal(id);
            // Then let everyone know that the App has been removed
            yield this.bridges.getAppActivationBridge().doAppRemoved(app).catch();
            return app;
        });
    }
    /**
     * Removes the app instance from the local Apps container
     * and every type of data associated with it
     */
    removeLocal(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const app = this.apps.get(id);
            if (AppStatus_1.AppStatusUtils.isEnabled(yield app.getStatus())) {
                yield this.disable(id);
            }
            yield this.purgeAppConfig(app);
            this.listenerManager.releaseEssentialEvents(app);
            yield this.removeAppUser(app);
            yield this.bridges.getPersistenceBridge().purge(app.getID());
            yield this.appMetadataStorage.remove(app.getID());
            yield this.appSourceStorage.remove(app.getStorageItem()).catch(() => { });
            // Errors here don't really prevent the process from dying, so we don't really need to do anything on the catch
            yield this.getRuntime()
                .stopRuntime(app.getDenoRuntime())
                .catch(() => { });
            this.apps.delete(app.getID());
        });
    }
    update(appPackage_1, permissionsGranted_1) {
        return __awaiter(this, arguments, void 0, function* (appPackage, permissionsGranted, updateOptions = { loadApp: true }) {
            var _a;
            const aff = new compiler_1.AppFabricationFulfillment();
            const result = yield this.getParser().unpackageApp(appPackage);
            aff.setAppInfo(result.info);
            aff.setImplementedInterfaces(result.implemented.getValues());
            const old = yield this.appMetadataStorage.retrieveOne(result.info.id);
            if (!old) {
                throw new Error('Can not update an App that does not currently exist.');
            }
            // If there is any error during disabling, it doesn't really matter
            yield this.disable(old.id).catch(() => { });
            const descriptor = Object.assign(Object.assign({}, old), { createdAt: old.createdAt, id: result.info.id, info: result.info, status: (yield ((_a = this.apps.get(old.id)) === null || _a === void 0 ? void 0 : _a.getStatus())) || old.status, languageContent: result.languageContent, settings: old.settings, implemented: result.implemented.getValues(), marketplaceInfo: old.marketplaceInfo, sourcePath: old.sourcePath, permissionsGranted });
            try {
                descriptor.sourcePath = yield this.appSourceStorage.update(descriptor, appPackage);
            }
            catch (error) {
                aff.setStorageError('Failed to storage app package');
                return aff;
            }
            descriptor.signature = yield this.signatureManager.signApp(descriptor);
            const stored = yield this.appMetadataStorage.update(descriptor);
            // Errors here don't really prevent the process from dying, so we don't really need to do anything on the catch
            yield this.getRuntime()
                .stopRuntime(this.apps.get(old.id).getDenoRuntime())
                .catch(() => { });
            const app = yield this.getCompiler().toSandBox(this, descriptor, result);
            // Ensure there is an user for the app
            try {
                yield this.createAppUser(result.info);
            }
            catch (err) {
                aff.setAppUserError({
                    username: `${result.info.nameSlug}.bot`,
                    message: 'Failed to create an app user for this app.',
                });
                return aff;
            }
            aff.setApp(app);
            if (updateOptions.loadApp) {
                const shouldEnableApp = AppStatus_1.AppStatusUtils.isEnabled(old.status);
                if (shouldEnableApp) {
                    yield this.updateAndStartupLocal(stored, app);
                }
                else {
                    yield this.updateAndInitializeLocal(stored, app);
                }
                yield this.bridges
                    .getAppActivationBridge()
                    .doAppUpdated(app)
                    .catch(() => { });
            }
            yield this.updateApp(app, updateOptions.user, old.info.version);
            return aff;
        });
    }
    /**
     * Updates the local instance of an app.
     *
     * If the second parameter is a Buffer of an app package,
     * unpackage and instantiate the app's main class
     *
     * With an instance of a ProxiedApp, start it up and replace
     * the reference in the local app collection
     */
    updateLocal(stored, appPackageOrInstance) {
        return __awaiter(this, void 0, void 0, function* () {
            const app = yield (() => __awaiter(this, void 0, void 0, function* () {
                if (appPackageOrInstance instanceof buffer_1.Buffer) {
                    const parseResult = yield this.getParser().unpackageApp(appPackageOrInstance);
                    // Errors here don't really prevent the process from dying, so we don't really need to do anything on the catch
                    yield this.getRuntime()
                        .stopRuntime(this.apps.get(stored.id).getDenoRuntime())
                        .catch(() => { });
                    return this.getCompiler().toSandBox(this, stored, parseResult);
                }
                return appPackageOrInstance;
            }))();
            yield this.purgeAppConfig(app, { keepScheduledJobs: true });
            this.apps.set(app.getID(), app);
            return app;
        });
    }
    updateAndStartupLocal(stored, appPackageOrInstance) {
        return __awaiter(this, void 0, void 0, function* () {
            const app = yield this.updateLocal(stored, appPackageOrInstance);
            yield this.runStartUpProcess(stored, app, false, true);
        });
    }
    updateAndInitializeLocal(stored, appPackageOrInstance) {
        return __awaiter(this, void 0, void 0, function* () {
            const app = yield this.updateLocal(stored, appPackageOrInstance);
            yield this.initializeApp(stored, app, true, true);
        });
    }
    getLanguageContent() {
        const langs = {};
        this.apps.forEach((rl) => {
            const content = rl.getStorageItem().languageContent;
            Object.keys(content).forEach((key) => {
                langs[key] = Object.assign(langs[key] || {}, content[key]);
            });
        });
        return langs;
    }
    changeStatus(appId, status) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (status) {
                case AppStatus_1.AppStatus.MANUALLY_DISABLED:
                case AppStatus_1.AppStatus.MANUALLY_ENABLED:
                    break;
                default:
                    throw new Error('Invalid status to change an App to, must be manually disabled or enabled.');
            }
            const rl = this.apps.get(appId);
            if (!rl) {
                throw new Error('Can not change the status of an App which does not currently exist.');
            }
            if (AppStatus_1.AppStatusUtils.isEnabled(status)) {
                // Then enable it
                if (AppStatus_1.AppStatusUtils.isEnabled(yield rl.getStatus())) {
                    throw new Error('Can not enable an App which is already enabled.');
                }
                yield this.enable(rl.getID());
            }
            else {
                if (!AppStatus_1.AppStatusUtils.isEnabled(yield rl.getStatus())) {
                    throw new Error('Can not disable an App which is not enabled.');
                }
                yield this.disable(rl.getID(), AppStatus_1.AppStatus.MANUALLY_DISABLED);
            }
            return rl;
        });
    }
    updateAppsMarketplaceInfo(appsOverview) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(appsOverview.map((_a) => __awaiter(this, [_a], void 0, function* ({ latest: appInfo }) {
                var _b;
                if (!appInfo.subscriptionInfo) {
                    return;
                }
                const app = this.apps.get(appInfo.id);
                if (!app) {
                    return;
                }
                const appStorageItem = app.getStorageItem();
                const subscriptionInfo = (_b = appStorageItem.marketplaceInfo) === null || _b === void 0 ? void 0 : _b.subscriptionInfo;
                if (subscriptionInfo && subscriptionInfo.license.license === appInfo.subscriptionInfo.license.license) {
                    return;
                }
                appStorageItem.marketplaceInfo.subscriptionInfo = appInfo.subscriptionInfo;
                return this.appMetadataStorage.update(appStorageItem);
            }))).catch();
            const queue = [];
            this.apps.forEach((app) => queue.push(app
                .validateLicense()
                .then(() => __awaiter(this, void 0, void 0, function* () {
                if ((yield app.getStatus()) !== AppStatus_1.AppStatus.INVALID_LICENSE_DISABLED) {
                    return;
                }
                return app.setStatus(AppStatus_1.AppStatus.DISABLED);
            }))
                .catch((error) => __awaiter(this, void 0, void 0, function* () {
                if (!(error instanceof errors_1.InvalidLicenseError)) {
                    console.error(error);
                    return;
                }
                yield this.purgeAppConfig(app);
                return app.setStatus(AppStatus_1.AppStatus.INVALID_LICENSE_DISABLED);
            }))
                .then(() => __awaiter(this, void 0, void 0, function* () {
                const status = yield app.getStatus();
                if (status === app.getPreviousStatus()) {
                    return;
                }
                const storageItem = app.getStorageItem();
                storageItem.status = status;
                return this.appMetadataStorage.update(storageItem).catch(console.error);
            }))));
            yield Promise.all(queue);
        });
    }
    /**
     * Goes through the entire loading up process.
     *
     * @param appId the id of the application to load
     */
    loadOne(appId_1) {
        return __awaiter(this, arguments, void 0, function* (appId, silenceStatus = false) {
            const rl = this.apps.get(appId);
            if (!rl) {
                throw new Error(`No App found by the id of: "${appId}"`);
            }
            const item = rl.getStorageItem();
            yield this.initializeApp(item, rl, false, silenceStatus);
            if (!this.areRequiredSettingsSet(item)) {
                yield rl.setStatus(AppStatus_1.AppStatus.INVALID_SETTINGS_DISABLED);
            }
            if (!AppStatus_1.AppStatusUtils.isDisabled(yield rl.getStatus()) && AppStatus_1.AppStatusUtils.isEnabled(rl.getPreviousStatus())) {
                yield this.enableApp(item, rl, false, rl.getPreviousStatus() === AppStatus_1.AppStatus.MANUALLY_ENABLED, silenceStatus);
            }
            return this.apps.get(item.id);
        });
    }
    runStartUpProcess(storageItem, app, isManual, silenceStatus) {
        return __awaiter(this, void 0, void 0, function* () {
            if ((yield app.getStatus()) !== AppStatus_1.AppStatus.INITIALIZED) {
                const isInitialized = yield this.initializeApp(storageItem, app, true, silenceStatus);
                if (!isInitialized) {
                    return false;
                }
            }
            if (!this.areRequiredSettingsSet(storageItem)) {
                yield app.setStatus(AppStatus_1.AppStatus.INVALID_SETTINGS_DISABLED, silenceStatus);
                return false;
            }
            return this.enableApp(storageItem, app, true, isManual, silenceStatus);
        });
    }
    installApp(_storageItem, app, user) {
        return __awaiter(this, void 0, void 0, function* () {
            let result;
            const context = { user };
            try {
                yield app.call(metadata_1.AppMethod.ONINSTALL, context);
                result = true;
            }
            catch (e) {
                const status = AppStatus_1.AppStatus.ERROR_DISABLED;
                result = false;
                yield app.setStatus(status);
            }
            return result;
        });
    }
    updateApp(app, user, oldAppVersion) {
        return __awaiter(this, void 0, void 0, function* () {
            let result;
            try {
                yield app.call(metadata_1.AppMethod.ONUPDATE, { oldAppVersion, user });
                result = true;
            }
            catch (e) {
                const status = AppStatus_1.AppStatus.ERROR_DISABLED;
                result = false;
                yield app.setStatus(status);
            }
            return result;
        });
    }
    initializeApp(storageItem_1, app_1) {
        return __awaiter(this, arguments, void 0, function* (storageItem, app, saveToDb = true, silenceStatus = false) {
            let result;
            try {
                yield app.validateLicense();
                yield app.validateInstallation();
                yield app.call(metadata_1.AppMethod.INITIALIZE);
                yield app.setStatus(AppStatus_1.AppStatus.INITIALIZED, silenceStatus);
                result = true;
            }
            catch (e) {
                let status = AppStatus_1.AppStatus.ERROR_DISABLED;
                if (e instanceof errors_1.InvalidLicenseError) {
                    status = AppStatus_1.AppStatus.INVALID_LICENSE_DISABLED;
                }
                if (e instanceof InvalidInstallationError_1.InvalidInstallationError) {
                    status = AppStatus_1.AppStatus.INVALID_INSTALLATION_DISABLED;
                }
                yield this.purgeAppConfig(app);
                result = false;
                yield app.setStatus(status, silenceStatus);
            }
            if (saveToDb) {
                // This is async, but we don't care since it only updates in the database
                // and it should not mutate any properties we care about
                storageItem.status = yield app.getStatus();
                yield this.appMetadataStorage.update(storageItem).catch();
            }
            return result;
        });
    }
    purgeAppConfig(app_1) {
        return __awaiter(this, arguments, void 0, function* (app, opts = {}) {
            if (!opts.keepScheduledJobs) {
                yield this.schedulerManager.cleanUp(app.getID());
            }
            this.listenerManager.unregisterListeners(app);
            this.listenerManager.lockEssentialEvents(app);
            yield this.commandManager.unregisterCommands(app.getID());
            this.externalComponentManager.unregisterExternalComponents(app.getID());
            yield this.apiManager.unregisterApis(app.getID());
            this.accessorManager.purifyApp(app.getID());
            this.uiActionButtonManager.clearAppActionButtons(app.getID());
            this.videoConfProviderManager.unregisterProviders(app.getID());
        });
    }
    /**
     * Determines if the App's required settings are set or not.
     * Should a packageValue be provided and not empty, then it's considered set.
     */
    areRequiredSettingsSet(storageItem) {
        let result = true;
        for (const setk of Object.keys(storageItem.settings)) {
            const sett = storageItem.settings[setk];
            // If it's not required, ignore
            if (!sett.required) {
                continue;
            }
            if (sett.value !== 'undefined' || sett.packageValue !== 'undefined') {
                continue;
            }
            result = false;
        }
        return result;
    }
    enableApp(storageItem_1, app_1) {
        return __awaiter(this, arguments, void 0, function* (storageItem, app, saveToDb = true, isManual, silenceStatus = false) {
            let enable;
            let status = AppStatus_1.AppStatus.ERROR_DISABLED;
            try {
                yield app.validateLicense();
                yield app.validateInstallation();
                enable = (yield app.call(metadata_1.AppMethod.ONENABLE));
                if (enable) {
                    status = isManual ? AppStatus_1.AppStatus.MANUALLY_ENABLED : AppStatus_1.AppStatus.AUTO_ENABLED;
                }
                else {
                    status = AppStatus_1.AppStatus.DISABLED;
                    console.warn(`The App (${app.getID()}) disabled itself when being enabled. \nCheck the "onEnable" implementation for details.`);
                }
            }
            catch (e) {
                enable = false;
                if (e instanceof errors_1.InvalidLicenseError) {
                    status = AppStatus_1.AppStatus.INVALID_LICENSE_DISABLED;
                }
                if (e instanceof InvalidInstallationError_1.InvalidInstallationError) {
                    status = AppStatus_1.AppStatus.INVALID_INSTALLATION_DISABLED;
                }
                console.error(e);
            }
            if (enable) {
                yield this.commandManager.registerCommands(app.getID());
                this.externalComponentManager.registerExternalComponents(app.getID());
                yield this.apiManager.registerApis(app.getID());
                this.listenerManager.registerListeners(app);
                this.listenerManager.releaseEssentialEvents(app);
                this.videoConfProviderManager.registerProviders(app.getID());
            }
            else {
                yield this.purgeAppConfig(app);
            }
            if (saveToDb) {
                storageItem.status = status;
                // This is async, but we don't care since it only updates in the database
                // and it should not mutate any properties we care about
                yield this.appMetadataStorage.update(storageItem).catch();
            }
            yield app.setStatus(status, silenceStatus);
            return enable;
        });
    }
    createAppUser(appInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            const appUser = yield this.bridges.getUserBridge().getAppUser(appInfo.id);
            if (appUser) {
                return appUser.id;
            }
            const userData = {
                username: `${appInfo.nameSlug}.bot`,
                name: appInfo.name,
                roles: ['app'],
                appId: appInfo.id,
                type: users_1.UserType.APP,
                status: 'online',
                isEnabled: true,
            };
            return this.bridges.getUserBridge().create(userData, appInfo.id, {
                avatarUrl: appInfo.iconFileContent || appInfo.iconFile,
                joinDefaultChannels: true,
                sendWelcomeEmail: false,
            });
        });
    }
    removeAppUser(app) {
        return __awaiter(this, void 0, void 0, function* () {
            const appUser = yield this.bridges.getUserBridge().getAppUser(app.getID());
            if (!appUser) {
                return true;
            }
            return this.bridges.getUserBridge().remove(appUser, app.getID());
        });
    }
    uninstallApp(app, user) {
        return __awaiter(this, void 0, void 0, function* () {
            let result;
            const context = { user };
            try {
                yield app.call(metadata_1.AppMethod.ONUNINSTALL, context);
                result = true;
            }
            catch (e) {
                const status = AppStatus_1.AppStatus.ERROR_DISABLED;
                result = false;
                yield app.setStatus(status);
            }
            return result;
        });
    }
}
exports.AppManager = AppManager;
const getPermissionsByAppId = (appId) => {
    if (!AppManager.Instance) {
        console.error('AppManager should be instantiated first');
        return [];
    }
    return AppManager.Instance.getPermissionsById(appId);
};
exports.getPermissionsByAppId = getPermissionsByAppId;
//# sourceMappingURL=AppManager.js.map