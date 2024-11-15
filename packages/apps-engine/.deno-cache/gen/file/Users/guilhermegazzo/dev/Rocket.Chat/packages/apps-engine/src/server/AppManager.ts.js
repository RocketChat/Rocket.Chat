import { Buffer } from 'buffer';
import { ProxiedApp } from './ProxiedApp';
import { AppBridges } from './bridges';
import { AppStatus, AppStatusUtils } from '../definition/AppStatus';
import { AppMethod } from '../definition/metadata';
import { UserType } from '../definition/users';
import { AppCompiler, AppFabricationFulfillment, AppPackageParser } from './compiler';
import { InvalidLicenseError } from './errors';
import { InvalidInstallationError } from './errors/InvalidInstallationError';
import { AppAccessorManager, AppApiManager, AppExternalComponentManager, AppLicenseManager, AppListenerManager, AppSchedulerManager, AppSettingsManager, AppSlashCommandManager, AppVideoConfProviderManager } from './managers';
import { AppRuntimeManager } from './managers/AppRuntimeManager';
import { AppSignatureManager } from './managers/AppSignatureManager';
import { UIActionButtonManager } from './managers/UIActionButtonManager';
import { defaultPermissions } from './permissions/AppPermissions';
import { AppLogStorage, AppMetadataStorage } from './storage';
import { AppSourceStorage } from './storage/AppSourceStorage';
import { AppInstallationSource } from './storage/IAppStorageItem';
export class AppManager {
  static Instance;
  // apps contains all of the Apps
  apps;
  appMetadataStorage;
  appSourceStorage;
  logStorage;
  bridges;
  parser;
  compiler;
  accessorManager;
  listenerManager;
  commandManager;
  apiManager;
  externalComponentManager;
  settingsManager;
  licenseManager;
  schedulerManager;
  uiActionButtonManager;
  videoConfProviderManager;
  signatureManager;
  runtime;
  isLoaded;
  constructor({ metadataStorage, logStorage, bridges, sourceStorage }){
    // Singleton style. There can only ever be one AppManager instance
    if (typeof AppManager.Instance !== 'undefined') {
      throw new Error('There is already a valid AppManager instance');
    }
    if (metadataStorage instanceof AppMetadataStorage) {
      this.appMetadataStorage = metadataStorage;
    } else {
      throw new Error('Invalid instance of the AppMetadataStorage');
    }
    if (logStorage instanceof AppLogStorage) {
      this.logStorage = logStorage;
    } else {
      throw new Error('Invalid instance of the AppLogStorage');
    }
    if (bridges instanceof AppBridges) {
      this.bridges = bridges;
    } else {
      throw new Error('Invalid instance of the AppBridges');
    }
    if (sourceStorage instanceof AppSourceStorage) {
      this.appSourceStorage = sourceStorage;
    } else {
      throw new Error('Invalid instance of the AppSourceStorage');
    }
    this.apps = new Map();
    this.parser = new AppPackageParser();
    this.compiler = new AppCompiler();
    this.accessorManager = new AppAccessorManager(this);
    this.listenerManager = new AppListenerManager(this);
    this.commandManager = new AppSlashCommandManager(this);
    this.apiManager = new AppApiManager(this);
    this.externalComponentManager = new AppExternalComponentManager();
    this.settingsManager = new AppSettingsManager(this);
    this.licenseManager = new AppLicenseManager(this);
    this.schedulerManager = new AppSchedulerManager(this);
    this.uiActionButtonManager = new UIActionButtonManager(this);
    this.videoConfProviderManager = new AppVideoConfProviderManager(this);
    this.signatureManager = new AppSignatureManager(this);
    this.runtime = new AppRuntimeManager(this);
    this.isLoaded = false;
    AppManager.Instance = this;
  }
  /** Gets the instance of the storage connector. */ getStorage() {
    return this.appMetadataStorage;
  }
  /** Gets the instance of the log storage connector. */ getLogStorage() {
    return this.logStorage;
  }
  /** Gets the instance of the App package parser. */ getParser() {
    return this.parser;
  }
  /** Gets the compiler instance. */ getCompiler() {
    return this.compiler;
  }
  /** Gets the accessor manager instance. */ getAccessorManager() {
    return this.accessorManager;
  }
  /** Gets the instance of the Bridge manager. */ getBridges() {
    return this.bridges;
  }
  /** Gets the instance of the listener manager. */ getListenerManager() {
    return this.listenerManager;
  }
  /** Gets the command manager's instance. */ getCommandManager() {
    return this.commandManager;
  }
  getVideoConfProviderManager() {
    return this.videoConfProviderManager;
  }
  getLicenseManager() {
    return this.licenseManager;
  }
  /** Gets the api manager's instance. */ getApiManager() {
    return this.apiManager;
  }
  /** Gets the external component manager's instance. */ getExternalComponentManager() {
    return this.externalComponentManager;
  }
  /** Gets the manager of the settings, updates and getting. */ getSettingsManager() {
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
  /** Gets whether the Apps have been loaded or not. */ areAppsLoaded() {
    return this.isLoaded;
  }
  setSourceStorage(storage) {
    this.appSourceStorage = storage;
  }
  /**
     * Goes through the entire loading up process.
     * Expect this to take some time, as it goes through a very
     * long process of loading all the Apps up.
     */ async load() {
    // You can not load the AppManager system again
    // if it has already been loaded.
    if (this.isLoaded) {
      return true;
    }
    const items = await this.appMetadataStorage.retrieveAll();
    for (const item of items.values()){
      try {
        const appPackage = await this.appSourceStorage.fetch(item);
        const unpackageResult = await this.getParser().unpackageApp(appPackage);
        const app = await this.getCompiler().toSandBox(this, item, unpackageResult);
        this.apps.set(item.id, app);
      } catch (e) {
        console.warn(`Error while compiling the App "${item.info.name} (${item.id})":`);
        console.error(e);
        const prl = new ProxiedApp(this, item, {
          // Maybe we should have an "EmptyRuntime" class for this?
          getStatus () {
            return AppStatus.COMPILER_ERROR_DISABLED;
          }
        });
        this.apps.set(item.id, prl);
      }
    }
    this.isLoaded = true;
    return true;
  }
  async enableAll() {
    const affs = [];
    // Let's initialize them
    for (const rl of this.apps.values()){
      const aff = new AppFabricationFulfillment();
      aff.setAppInfo(rl.getInfo());
      aff.setImplementedInterfaces(rl.getImplementationList());
      aff.setApp(rl);
      affs.push(aff);
      if (AppStatusUtils.isDisabled(await rl.getStatus())) {
        // Usually if an App is disabled before it's initialized,
        // then something (such as an error) occured while
        // it was compiled or something similar.
        // We still have to validate its license, though
        await rl.validateLicense();
        continue;
      }
      await this.initializeApp(rl.getStorageItem(), rl, false, true).catch(console.error);
    }
    // Let's ensure the required settings are all set
    for (const rl of this.apps.values()){
      if (AppStatusUtils.isDisabled(await rl.getStatus())) {
        continue;
      }
      if (!this.areRequiredSettingsSet(rl.getStorageItem())) {
        await rl.setStatus(AppStatus.INVALID_SETTINGS_DISABLED).catch(console.error);
      }
    }
    // Now let's enable the apps which were once enabled
    // but are not currently disabled.
    for (const app of this.apps.values()){
      const status = await app.getStatus();
      if (!AppStatusUtils.isDisabled(status) && AppStatusUtils.isEnabled(app.getPreviousStatus())) {
        await this.enableApp(app.getStorageItem(), app, true, app.getPreviousStatus() === AppStatus.MANUALLY_ENABLED).catch(console.error);
      } else if (!AppStatusUtils.isError(status)) {
        this.listenerManager.lockEssentialEvents(app);
        this.uiActionButtonManager.clearAppActionButtons(app.getID());
      }
    }
    return affs;
  }
  async unload(isManual) {
    // If the AppManager hasn't been loaded yet, then
    // there is nothing to unload
    if (!this.isLoaded) {
      return;
    }
    for (const app of this.apps.values()){
      const status = await app.getStatus();
      if (status === AppStatus.INITIALIZED) {
        await this.purgeAppConfig(app);
      } else if (!AppStatusUtils.isDisabled(status)) {
        await this.disable(app.getID(), isManual ? AppStatus.MANUALLY_DISABLED : AppStatus.DISABLED);
      }
      this.listenerManager.releaseEssentialEvents(app);
      app.getDenoRuntime().stopApp();
    }
    // Remove all the apps from the system now that we have unloaded everything
    this.apps.clear();
    this.isLoaded = false;
  }
  /** Gets the Apps which match the filter passed in. */ async get(filter) {
    let rls = [];
    if (typeof filter === 'undefined') {
      this.apps.forEach((rl)=>rls.push(rl));
      return rls;
    }
    let nothing = true;
    if (typeof filter.enabled === 'boolean' && filter.enabled) {
      for (const rl of this.apps.values()){
        if (AppStatusUtils.isEnabled(await rl.getStatus())) {
          rls.push(rl);
        }
      }
      nothing = false;
    }
    if (typeof filter.disabled === 'boolean' && filter.disabled) {
      for (const rl of this.apps.values()){
        if (AppStatusUtils.isDisabled(await rl.getStatus())) {
          rls.push(rl);
        }
      }
      nothing = false;
    }
    if (nothing) {
      this.apps.forEach((rl)=>rls.push(rl));
    }
    if (typeof filter.ids !== 'undefined') {
      rls = rls.filter((rl)=>filter.ids.includes(rl.getID()));
    }
    if (typeof filter.installationSource !== 'undefined') {
      rls = rls.filter((rl)=>rl.getInstallationSource() === filter.installationSource);
    }
    if (typeof filter.name === 'string') {
      rls = rls.filter((rl)=>rl.getName() === filter.name);
    } else if (filter.name instanceof RegExp) {
      rls = rls.filter((rl)=>filter.name.test(rl.getName()));
    }
    return rls;
  }
  /** Gets a single App by the id passed in. */ getOneById(appId) {
    return this.apps.get(appId);
  }
  getPermissionsById(appId) {
    const app = this.apps.get(appId);
    if (!app) {
      return [];
    }
    const { permissionsGranted } = app.getStorageItem();
    return permissionsGranted || defaultPermissions;
  }
  async enable(id) {
    const rl = this.apps.get(id);
    if (!rl) {
      throw new Error(`No App by the id "${id}" exists.`);
    }
    const status = await rl.getStatus();
    if (AppStatusUtils.isEnabled(status)) {
      return true;
    }
    if (status === AppStatus.COMPILER_ERROR_DISABLED) {
      throw new Error('The App had compiler errors, can not enable it.');
    }
    const storageItem = await this.appMetadataStorage.retrieveOne(id);
    if (!storageItem) {
      throw new Error(`Could not enable an App with the id of "${id}" as it doesn't exist.`);
    }
    const isSetup = await this.runStartUpProcess(storageItem, rl, true, false);
    if (isSetup) {
      storageItem.status = await rl.getStatus();
      // This is async, but we don't care since it only updates in the database
      // and it should not mutate any properties we care about
      await this.appMetadataStorage.update(storageItem).catch();
    }
    return isSetup;
  }
  async disable(id, status = AppStatus.DISABLED, silent) {
    if (!AppStatusUtils.isDisabled(status)) {
      throw new Error('Invalid disabled status');
    }
    const app = this.apps.get(id);
    if (!app) {
      throw new Error(`No App by the id "${id}" exists.`);
    }
    if (AppStatusUtils.isEnabled(await app.getStatus())) {
      await app.call(AppMethod.ONDISABLE).catch((e)=>console.warn('Error while disabling:', e));
    }
    await this.purgeAppConfig(app, {
      keepScheduledJobs: true
    });
    await app.setStatus(status, silent);
    const storageItem = await this.appMetadataStorage.retrieveOne(id);
    app.getStorageItem().marketplaceInfo = storageItem.marketplaceInfo;
    await app.validateLicense().catch();
    storageItem.status = await app.getStatus();
    // This is async, but we don't care since it only updates in the database
    // and it should not mutate any properties we care about
    await this.appMetadataStorage.update(storageItem).catch();
    return true;
  }
  async migrate(id) {
    const app = this.apps.get(id);
    if (!app) {
      throw new Error(`No App by the id "${id}" exists.`);
    }
    await app.call(AppMethod.ONUPDATE).catch((e)=>console.warn('Error while migrating:', e));
    await this.purgeAppConfig(app, {
      keepScheduledJobs: true
    });
    const storageItem = await this.appMetadataStorage.retrieveOne(id);
    app.getStorageItem().marketplaceInfo = storageItem.marketplaceInfo;
    await app.validateLicense().catch();
    storageItem.migrated = true;
    storageItem.signature = await this.getSignatureManager().signApp(storageItem);
    // This is async, but we don't care since it only updates in the database
    // and it should not mutate any properties we care about
    const stored = await this.appMetadataStorage.update(storageItem).catch();
    await this.updateLocal(stored, app);
    await this.bridges.getAppActivationBridge().doAppUpdated(app).catch(()=>{});
    return true;
  }
  async addLocal(appId) {
    const storageItem = await this.appMetadataStorage.retrieveOne(appId);
    if (!storageItem) {
      throw new Error(`App with id ${appId} couldn't be found`);
    }
    const appPackage = await this.appSourceStorage.fetch(storageItem);
    if (!appPackage) {
      throw new Error(`Package file for app "${storageItem.info.name}" (${appId}) couldn't be found`);
    }
    const parsedPackage = await this.getParser().unpackageApp(appPackage);
    const app = await this.getCompiler().toSandBox(this, storageItem, parsedPackage);
    this.apps.set(app.getID(), app);
    await this.loadOne(appId);
  }
  async add(appPackage, installationParameters) {
    const { enable = true, marketplaceInfo, permissionsGranted, user } = installationParameters;
    const aff = new AppFabricationFulfillment();
    const result = await this.getParser().unpackageApp(appPackage);
    const undoSteps = [];
    aff.setAppInfo(result.info);
    aff.setImplementedInterfaces(result.implemented.getValues());
    const descriptor = {
      id: result.info.id,
      info: result.info,
      status: AppStatus.UNKNOWN,
      settings: {},
      implemented: result.implemented.getValues(),
      installationSource: marketplaceInfo ? AppInstallationSource.MARKETPLACE : AppInstallationSource.PRIVATE,
      marketplaceInfo,
      permissionsGranted,
      languageContent: result.languageContent
    };
    try {
      descriptor.sourcePath = await this.appSourceStorage.store(descriptor, appPackage);
      undoSteps.push(()=>this.appSourceStorage.remove(descriptor));
    } catch (error) {
      aff.setStorageError('Failed to store app package');
      return aff;
    }
    // Now that is has all been compiled, let's get the
    // the App instance from the source.
    const app = await this.getCompiler().toSandBox(this, descriptor, result);
    undoSteps.push(()=>this.getRuntime().stopRuntime(app.getDenoRuntime()).catch(()=>{}));
    // Create a user for the app
    try {
      await this.createAppUser(result.info);
      undoSteps.push(()=>this.removeAppUser(app));
    } catch (err) {
      aff.setAppUserError({
        username: `${result.info.nameSlug}.bot`,
        message: 'Failed to create an app user for this app.'
      });
      await Promise.all(undoSteps.map((undoer)=>undoer()));
      return aff;
    }
    descriptor.signature = await this.getSignatureManager().signApp(descriptor);
    const created = await this.appMetadataStorage.create(descriptor);
    if (!created) {
      aff.setStorageError('Failed to create the App, the storage did not return it.');
      await Promise.all(undoSteps.map((undoer)=>undoer()));
      return aff;
    }
    this.apps.set(app.getID(), app);
    aff.setApp(app);
    // Let everyone know that the App has been added
    await this.bridges.getAppActivationBridge().doAppAdded(app).catch(()=>{
    // If an error occurs during this, oh well.
    });
    await this.installApp(created, app, user);
    // Should enable === true, then we go through the entire start up process
    // Otherwise, we only initialize it.
    if (enable) {
      // Start up the app
      await this.runStartUpProcess(created, app, false, false);
    } else {
      await this.initializeApp(created, app, true);
    }
    return aff;
  }
  /**
     * Uninstalls specified app from the server and remove
     * all database records regarding it
     *
     * @returns the instance of the removed ProxiedApp
     */ async remove(id, uninstallationParameters) {
    const app = this.apps.get(id);
    const { user } = uninstallationParameters;
    // First remove the app
    await this.uninstallApp(app, user);
    await this.removeLocal(id);
    // Then let everyone know that the App has been removed
    await this.bridges.getAppActivationBridge().doAppRemoved(app).catch();
    return app;
  }
  /**
     * Removes the app instance from the local Apps container
     * and every type of data associated with it
     */ async removeLocal(id) {
    const app = this.apps.get(id);
    if (AppStatusUtils.isEnabled(await app.getStatus())) {
      await this.disable(id);
    }
    await this.purgeAppConfig(app);
    this.listenerManager.releaseEssentialEvents(app);
    await this.removeAppUser(app);
    await this.bridges.getPersistenceBridge().purge(app.getID());
    await this.appMetadataStorage.remove(app.getID());
    await this.appSourceStorage.remove(app.getStorageItem()).catch(()=>{});
    // Errors here don't really prevent the process from dying, so we don't really need to do anything on the catch
    await this.getRuntime().stopRuntime(app.getDenoRuntime()).catch(()=>{});
    this.apps.delete(app.getID());
  }
  async update(appPackage, permissionsGranted, updateOptions = {
    loadApp: true
  }) {
    const aff = new AppFabricationFulfillment();
    const result = await this.getParser().unpackageApp(appPackage);
    aff.setAppInfo(result.info);
    aff.setImplementedInterfaces(result.implemented.getValues());
    const old = await this.appMetadataStorage.retrieveOne(result.info.id);
    if (!old) {
      throw new Error('Can not update an App that does not currently exist.');
    }
    // If there is any error during disabling, it doesn't really matter
    await this.disable(old.id).catch(()=>{});
    const descriptor = {
      ...old,
      createdAt: old.createdAt,
      id: result.info.id,
      info: result.info,
      status: await this.apps.get(old.id)?.getStatus() || old.status,
      languageContent: result.languageContent,
      settings: old.settings,
      implemented: result.implemented.getValues(),
      marketplaceInfo: old.marketplaceInfo,
      sourcePath: old.sourcePath,
      permissionsGranted
    };
    try {
      descriptor.sourcePath = await this.appSourceStorage.update(descriptor, appPackage);
    } catch (error) {
      aff.setStorageError('Failed to storage app package');
      return aff;
    }
    descriptor.signature = await this.signatureManager.signApp(descriptor);
    const stored = await this.appMetadataStorage.update(descriptor);
    // Errors here don't really prevent the process from dying, so we don't really need to do anything on the catch
    await this.getRuntime().stopRuntime(this.apps.get(old.id).getDenoRuntime()).catch(()=>{});
    const app = await this.getCompiler().toSandBox(this, descriptor, result);
    // Ensure there is an user for the app
    try {
      await this.createAppUser(result.info);
    } catch (err) {
      aff.setAppUserError({
        username: `${result.info.nameSlug}.bot`,
        message: 'Failed to create an app user for this app.'
      });
      return aff;
    }
    aff.setApp(app);
    if (updateOptions.loadApp) {
      const shouldEnableApp = AppStatusUtils.isEnabled(old.status);
      if (shouldEnableApp) {
        await this.updateAndStartupLocal(stored, app);
      } else {
        await this.updateAndInitializeLocal(stored, app);
      }
      await this.bridges.getAppActivationBridge().doAppUpdated(app).catch(()=>{});
    }
    await this.updateApp(app, updateOptions.user, old.info.version);
    return aff;
  }
  /**
     * Updates the local instance of an app.
     *
     * If the second parameter is a Buffer of an app package,
     * unpackage and instantiate the app's main class
     *
     * With an instance of a ProxiedApp, start it up and replace
     * the reference in the local app collection
     */ async updateLocal(stored, appPackageOrInstance) {
    const app = await (async ()=>{
      if (appPackageOrInstance instanceof Buffer) {
        const parseResult = await this.getParser().unpackageApp(appPackageOrInstance);
        // Errors here don't really prevent the process from dying, so we don't really need to do anything on the catch
        await this.getRuntime().stopRuntime(this.apps.get(stored.id).getDenoRuntime()).catch(()=>{});
        return this.getCompiler().toSandBox(this, stored, parseResult);
      }
      return appPackageOrInstance;
    })();
    await this.purgeAppConfig(app, {
      keepScheduledJobs: true
    });
    this.apps.set(app.getID(), app);
    return app;
  }
  async updateAndStartupLocal(stored, appPackageOrInstance) {
    const app = await this.updateLocal(stored, appPackageOrInstance);
    await this.runStartUpProcess(stored, app, false, true);
  }
  async updateAndInitializeLocal(stored, appPackageOrInstance) {
    const app = await this.updateLocal(stored, appPackageOrInstance);
    await this.initializeApp(stored, app, true, true);
  }
  getLanguageContent() {
    const langs = {};
    this.apps.forEach((rl)=>{
      const content = rl.getStorageItem().languageContent;
      Object.keys(content).forEach((key)=>{
        langs[key] = Object.assign(langs[key] || {}, content[key]);
      });
    });
    return langs;
  }
  async changeStatus(appId, status) {
    switch(status){
      case AppStatus.MANUALLY_DISABLED:
      case AppStatus.MANUALLY_ENABLED:
        break;
      default:
        throw new Error('Invalid status to change an App to, must be manually disabled or enabled.');
    }
    const rl = this.apps.get(appId);
    if (!rl) {
      throw new Error('Can not change the status of an App which does not currently exist.');
    }
    if (AppStatusUtils.isEnabled(status)) {
      // Then enable it
      if (AppStatusUtils.isEnabled(await rl.getStatus())) {
        throw new Error('Can not enable an App which is already enabled.');
      }
      await this.enable(rl.getID());
    } else {
      if (!AppStatusUtils.isEnabled(await rl.getStatus())) {
        throw new Error('Can not disable an App which is not enabled.');
      }
      await this.disable(rl.getID(), AppStatus.MANUALLY_DISABLED);
    }
    return rl;
  }
  async updateAppsMarketplaceInfo(appsOverview) {
    await Promise.all(appsOverview.map(async ({ latest: appInfo })=>{
      if (!appInfo.subscriptionInfo) {
        return;
      }
      const app = this.apps.get(appInfo.id);
      if (!app) {
        return;
      }
      const appStorageItem = app.getStorageItem();
      const subscriptionInfo = appStorageItem.marketplaceInfo?.subscriptionInfo;
      if (subscriptionInfo && subscriptionInfo.license.license === appInfo.subscriptionInfo.license.license) {
        return;
      }
      appStorageItem.marketplaceInfo.subscriptionInfo = appInfo.subscriptionInfo;
      return this.appMetadataStorage.update(appStorageItem);
    })).catch();
    const queue = [];
    this.apps.forEach((app)=>queue.push(app.validateLicense().then(async ()=>{
        if (await app.getStatus() !== AppStatus.INVALID_LICENSE_DISABLED) {
          return;
        }
        return app.setStatus(AppStatus.DISABLED);
      }).catch(async (error)=>{
        if (!(error instanceof InvalidLicenseError)) {
          console.error(error);
          return;
        }
        await this.purgeAppConfig(app);
        return app.setStatus(AppStatus.INVALID_LICENSE_DISABLED);
      }).then(async ()=>{
        const status = await app.getStatus();
        if (status === app.getPreviousStatus()) {
          return;
        }
        const storageItem = app.getStorageItem();
        storageItem.status = status;
        return this.appMetadataStorage.update(storageItem).catch(console.error);
      })));
    await Promise.all(queue);
  }
  /**
     * Goes through the entire loading up process.
     *
     * @param appId the id of the application to load
     */ async loadOne(appId, silenceStatus = false) {
    const rl = this.apps.get(appId);
    if (!rl) {
      throw new Error(`No App found by the id of: "${appId}"`);
    }
    const item = rl.getStorageItem();
    await this.initializeApp(item, rl, false, silenceStatus);
    if (!this.areRequiredSettingsSet(item)) {
      await rl.setStatus(AppStatus.INVALID_SETTINGS_DISABLED);
    }
    if (!AppStatusUtils.isDisabled(await rl.getStatus()) && AppStatusUtils.isEnabled(rl.getPreviousStatus())) {
      await this.enableApp(item, rl, false, rl.getPreviousStatus() === AppStatus.MANUALLY_ENABLED, silenceStatus);
    }
    return this.apps.get(item.id);
  }
  async runStartUpProcess(storageItem, app, isManual, silenceStatus) {
    if (await app.getStatus() !== AppStatus.INITIALIZED) {
      const isInitialized = await this.initializeApp(storageItem, app, true, silenceStatus);
      if (!isInitialized) {
        return false;
      }
    }
    if (!this.areRequiredSettingsSet(storageItem)) {
      await app.setStatus(AppStatus.INVALID_SETTINGS_DISABLED, silenceStatus);
      return false;
    }
    return this.enableApp(storageItem, app, true, isManual, silenceStatus);
  }
  async installApp(_storageItem, app, user) {
    let result;
    const context = {
      user
    };
    try {
      await app.call(AppMethod.ONINSTALL, context);
      result = true;
    } catch (e) {
      const status = AppStatus.ERROR_DISABLED;
      result = false;
      await app.setStatus(status);
    }
    return result;
  }
  async updateApp(app, user, oldAppVersion) {
    let result;
    try {
      await app.call(AppMethod.ONUPDATE, {
        oldAppVersion,
        user
      });
      result = true;
    } catch (e) {
      const status = AppStatus.ERROR_DISABLED;
      result = false;
      await app.setStatus(status);
    }
    return result;
  }
  async initializeApp(storageItem, app, saveToDb = true, silenceStatus = false) {
    let result;
    try {
      await app.validateLicense();
      await app.validateInstallation();
      await app.call(AppMethod.INITIALIZE);
      await app.setStatus(AppStatus.INITIALIZED, silenceStatus);
      result = true;
    } catch (e) {
      let status = AppStatus.ERROR_DISABLED;
      if (e instanceof InvalidLicenseError) {
        status = AppStatus.INVALID_LICENSE_DISABLED;
      }
      if (e instanceof InvalidInstallationError) {
        status = AppStatus.INVALID_INSTALLATION_DISABLED;
      }
      await this.purgeAppConfig(app);
      result = false;
      await app.setStatus(status, silenceStatus);
    }
    if (saveToDb) {
      // This is async, but we don't care since it only updates in the database
      // and it should not mutate any properties we care about
      storageItem.status = await app.getStatus();
      await this.appMetadataStorage.update(storageItem).catch();
    }
    return result;
  }
  async purgeAppConfig(app, opts = {}) {
    if (!opts.keepScheduledJobs) {
      await this.schedulerManager.cleanUp(app.getID());
    }
    this.listenerManager.unregisterListeners(app);
    this.listenerManager.lockEssentialEvents(app);
    await this.commandManager.unregisterCommands(app.getID());
    this.externalComponentManager.unregisterExternalComponents(app.getID());
    await this.apiManager.unregisterApis(app.getID());
    this.accessorManager.purifyApp(app.getID());
    this.uiActionButtonManager.clearAppActionButtons(app.getID());
    this.videoConfProviderManager.unregisterProviders(app.getID());
  }
  /**
     * Determines if the App's required settings are set or not.
     * Should a packageValue be provided and not empty, then it's considered set.
     */ areRequiredSettingsSet(storageItem) {
    let result = true;
    for (const setk of Object.keys(storageItem.settings)){
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
  async enableApp(storageItem, app, saveToDb = true, isManual, silenceStatus = false) {
    let enable;
    let status = AppStatus.ERROR_DISABLED;
    try {
      await app.validateLicense();
      await app.validateInstallation();
      enable = await app.call(AppMethod.ONENABLE);
      if (enable) {
        status = isManual ? AppStatus.MANUALLY_ENABLED : AppStatus.AUTO_ENABLED;
      } else {
        status = AppStatus.DISABLED;
        console.warn(`The App (${app.getID()}) disabled itself when being enabled. \nCheck the "onEnable" implementation for details.`);
      }
    } catch (e) {
      enable = false;
      if (e instanceof InvalidLicenseError) {
        status = AppStatus.INVALID_LICENSE_DISABLED;
      }
      if (e instanceof InvalidInstallationError) {
        status = AppStatus.INVALID_INSTALLATION_DISABLED;
      }
      console.error(e);
    }
    if (enable) {
      await this.commandManager.registerCommands(app.getID());
      this.externalComponentManager.registerExternalComponents(app.getID());
      await this.apiManager.registerApis(app.getID());
      this.listenerManager.registerListeners(app);
      this.listenerManager.releaseEssentialEvents(app);
      this.videoConfProviderManager.registerProviders(app.getID());
    } else {
      await this.purgeAppConfig(app);
    }
    if (saveToDb) {
      storageItem.status = status;
      // This is async, but we don't care since it only updates in the database
      // and it should not mutate any properties we care about
      await this.appMetadataStorage.update(storageItem).catch();
    }
    await app.setStatus(status, silenceStatus);
    return enable;
  }
  async createAppUser(appInfo) {
    const appUser = await this.bridges.getUserBridge().getAppUser(appInfo.id);
    if (appUser) {
      return appUser.id;
    }
    const userData = {
      username: `${appInfo.nameSlug}.bot`,
      name: appInfo.name,
      roles: [
        'app'
      ],
      appId: appInfo.id,
      type: UserType.APP,
      status: 'online',
      isEnabled: true
    };
    return this.bridges.getUserBridge().create(userData, appInfo.id, {
      avatarUrl: appInfo.iconFileContent || appInfo.iconFile,
      joinDefaultChannels: true,
      sendWelcomeEmail: false
    });
  }
  async removeAppUser(app) {
    const appUser = await this.bridges.getUserBridge().getAppUser(app.getID());
    if (!appUser) {
      return true;
    }
    return this.bridges.getUserBridge().remove(appUser, app.getID());
  }
  async uninstallApp(app, user) {
    let result;
    const context = {
      user
    };
    try {
      await app.call(AppMethod.ONUNINSTALL, context);
      result = true;
    } catch (e) {
      const status = AppStatus.ERROR_DISABLED;
      result = false;
      await app.setStatus(status);
    }
    return result;
  }
}
export const getPermissionsByAppId = (appId)=>{
  if (!AppManager.Instance) {
    console.error('AppManager should be instantiated first');
    return [];
  }
  return AppManager.Instance.getPermissionsById(appId);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvZ3VpbGhlcm1lZ2F6em8vZGV2L1JvY2tldC5DaGF0L3BhY2thZ2VzL2FwcHMtZW5naW5lL3NyYy9zZXJ2ZXIvQXBwTWFuYWdlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBCdWZmZXIgfSBmcm9tICdidWZmZXInO1xuXG5pbXBvcnQgdHlwZSB7IElHZXRBcHBzRmlsdGVyIH0gZnJvbSAnLi9JR2V0QXBwc0ZpbHRlcic7XG5pbXBvcnQgeyBQcm94aWVkQXBwIH0gZnJvbSAnLi9Qcm94aWVkQXBwJztcbmltcG9ydCB0eXBlIHsgUGVyc2lzdGVuY2VCcmlkZ2UsIFVzZXJCcmlkZ2UgfSBmcm9tICcuL2JyaWRnZXMnO1xuaW1wb3J0IHsgQXBwQnJpZGdlcyB9IGZyb20gJy4vYnJpZGdlcyc7XG5pbXBvcnQgeyBBcHBTdGF0dXMsIEFwcFN0YXR1c1V0aWxzIH0gZnJvbSAnLi4vZGVmaW5pdGlvbi9BcHBTdGF0dXMnO1xuaW1wb3J0IHR5cGUgeyBJQXBwSW5mbyB9IGZyb20gJy4uL2RlZmluaXRpb24vbWV0YWRhdGEnO1xuaW1wb3J0IHsgQXBwTWV0aG9kIH0gZnJvbSAnLi4vZGVmaW5pdGlvbi9tZXRhZGF0YSc7XG5pbXBvcnQgdHlwZSB7IElQZXJtaXNzaW9uIH0gZnJvbSAnLi4vZGVmaW5pdGlvbi9wZXJtaXNzaW9ucy9JUGVybWlzc2lvbic7XG5pbXBvcnQgdHlwZSB7IElVc2VyIH0gZnJvbSAnLi4vZGVmaW5pdGlvbi91c2Vycyc7XG5pbXBvcnQgeyBVc2VyVHlwZSB9IGZyb20gJy4uL2RlZmluaXRpb24vdXNlcnMnO1xuaW1wb3J0IHR5cGUgeyBJSW50ZXJuYWxQZXJzaXN0ZW5jZUJyaWRnZSB9IGZyb20gJy4vYnJpZGdlcy9JSW50ZXJuYWxQZXJzaXN0ZW5jZUJyaWRnZSc7XG5pbXBvcnQgdHlwZSB7IElJbnRlcm5hbFVzZXJCcmlkZ2UgfSBmcm9tICcuL2JyaWRnZXMvSUludGVybmFsVXNlckJyaWRnZSc7XG5pbXBvcnQgeyBBcHBDb21waWxlciwgQXBwRmFicmljYXRpb25GdWxmaWxsbWVudCwgQXBwUGFja2FnZVBhcnNlciB9IGZyb20gJy4vY29tcGlsZXInO1xuaW1wb3J0IHsgSW52YWxpZExpY2Vuc2VFcnJvciB9IGZyb20gJy4vZXJyb3JzJztcbmltcG9ydCB7IEludmFsaWRJbnN0YWxsYXRpb25FcnJvciB9IGZyb20gJy4vZXJyb3JzL0ludmFsaWRJbnN0YWxsYXRpb25FcnJvcic7XG5pbXBvcnQge1xuICAgIEFwcEFjY2Vzc29yTWFuYWdlcixcbiAgICBBcHBBcGlNYW5hZ2VyLFxuICAgIEFwcEV4dGVybmFsQ29tcG9uZW50TWFuYWdlcixcbiAgICBBcHBMaWNlbnNlTWFuYWdlcixcbiAgICBBcHBMaXN0ZW5lck1hbmFnZXIsXG4gICAgQXBwU2NoZWR1bGVyTWFuYWdlcixcbiAgICBBcHBTZXR0aW5nc01hbmFnZXIsXG4gICAgQXBwU2xhc2hDb21tYW5kTWFuYWdlcixcbiAgICBBcHBWaWRlb0NvbmZQcm92aWRlck1hbmFnZXIsXG59IGZyb20gJy4vbWFuYWdlcnMnO1xuaW1wb3J0IHsgQXBwUnVudGltZU1hbmFnZXIgfSBmcm9tICcuL21hbmFnZXJzL0FwcFJ1bnRpbWVNYW5hZ2VyJztcbmltcG9ydCB7IEFwcFNpZ25hdHVyZU1hbmFnZXIgfSBmcm9tICcuL21hbmFnZXJzL0FwcFNpZ25hdHVyZU1hbmFnZXInO1xuaW1wb3J0IHsgVUlBY3Rpb25CdXR0b25NYW5hZ2VyIH0gZnJvbSAnLi9tYW5hZ2Vycy9VSUFjdGlvbkJ1dHRvbk1hbmFnZXInO1xuaW1wb3J0IHR5cGUgeyBJTWFya2V0cGxhY2VJbmZvIH0gZnJvbSAnLi9tYXJrZXRwbGFjZSc7XG5pbXBvcnQgeyBkZWZhdWx0UGVybWlzc2lvbnMgfSBmcm9tICcuL3Blcm1pc3Npb25zL0FwcFBlcm1pc3Npb25zJztcbmltcG9ydCB0eXBlIHsgRGVub1J1bnRpbWVTdWJwcm9jZXNzQ29udHJvbGxlciB9IGZyb20gJy4vcnVudGltZS9kZW5vL0FwcHNFbmdpbmVEZW5vUnVudGltZSc7XG5pbXBvcnQgdHlwZSB7IElBcHBTdG9yYWdlSXRlbSB9IGZyb20gJy4vc3RvcmFnZSc7XG5pbXBvcnQgeyBBcHBMb2dTdG9yYWdlLCBBcHBNZXRhZGF0YVN0b3JhZ2UgfSBmcm9tICcuL3N0b3JhZ2UnO1xuaW1wb3J0IHsgQXBwU291cmNlU3RvcmFnZSB9IGZyb20gJy4vc3RvcmFnZS9BcHBTb3VyY2VTdG9yYWdlJztcbmltcG9ydCB7IEFwcEluc3RhbGxhdGlvblNvdXJjZSB9IGZyb20gJy4vc3RvcmFnZS9JQXBwU3RvcmFnZUl0ZW0nO1xuXG5leHBvcnQgaW50ZXJmYWNlIElBcHBJbnN0YWxsUGFyYW1ldGVycyB7XG4gICAgZW5hYmxlOiBib29sZWFuO1xuICAgIG1hcmtldHBsYWNlSW5mbz86IElNYXJrZXRwbGFjZUluZm87XG4gICAgcGVybWlzc2lvbnNHcmFudGVkPzogQXJyYXk8SVBlcm1pc3Npb24+O1xuICAgIHVzZXI6IElVc2VyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElBcHBVbmluc3RhbGxQYXJhbWV0ZXJzIHtcbiAgICB1c2VyOiBJVXNlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJQXBwTWFuYWdlckRlcHMge1xuICAgIG1ldGFkYXRhU3RvcmFnZTogQXBwTWV0YWRhdGFTdG9yYWdlO1xuICAgIGxvZ1N0b3JhZ2U6IEFwcExvZ1N0b3JhZ2U7XG4gICAgYnJpZGdlczogQXBwQnJpZGdlcztcbiAgICBzb3VyY2VTdG9yYWdlOiBBcHBTb3VyY2VTdG9yYWdlO1xufVxuXG5pbnRlcmZhY2UgSVB1cmdlQXBwQ29uZmlnT3B0cyB7XG4gICAga2VlcFNjaGVkdWxlZEpvYnM/OiBib29sZWFuO1xufVxuXG5leHBvcnQgY2xhc3MgQXBwTWFuYWdlciB7XG4gICAgcHVibGljIHN0YXRpYyBJbnN0YW5jZTogQXBwTWFuYWdlcjtcblxuICAgIC8vIGFwcHMgY29udGFpbnMgYWxsIG9mIHRoZSBBcHBzXG4gICAgcHJpdmF0ZSByZWFkb25seSBhcHBzOiBNYXA8c3RyaW5nLCBQcm94aWVkQXBwPjtcblxuICAgIHByaXZhdGUgcmVhZG9ubHkgYXBwTWV0YWRhdGFTdG9yYWdlOiBBcHBNZXRhZGF0YVN0b3JhZ2U7XG5cbiAgICBwcml2YXRlIGFwcFNvdXJjZVN0b3JhZ2U6IEFwcFNvdXJjZVN0b3JhZ2U7XG5cbiAgICBwcml2YXRlIHJlYWRvbmx5IGxvZ1N0b3JhZ2U6IEFwcExvZ1N0b3JhZ2U7XG5cbiAgICBwcml2YXRlIHJlYWRvbmx5IGJyaWRnZXM6IEFwcEJyaWRnZXM7XG5cbiAgICBwcml2YXRlIHJlYWRvbmx5IHBhcnNlcjogQXBwUGFja2FnZVBhcnNlcjtcblxuICAgIHByaXZhdGUgcmVhZG9ubHkgY29tcGlsZXI6IEFwcENvbXBpbGVyO1xuXG4gICAgcHJpdmF0ZSByZWFkb25seSBhY2Nlc3Nvck1hbmFnZXI6IEFwcEFjY2Vzc29yTWFuYWdlcjtcblxuICAgIHByaXZhdGUgcmVhZG9ubHkgbGlzdGVuZXJNYW5hZ2VyOiBBcHBMaXN0ZW5lck1hbmFnZXI7XG5cbiAgICBwcml2YXRlIHJlYWRvbmx5IGNvbW1hbmRNYW5hZ2VyOiBBcHBTbGFzaENvbW1hbmRNYW5hZ2VyO1xuXG4gICAgcHJpdmF0ZSByZWFkb25seSBhcGlNYW5hZ2VyOiBBcHBBcGlNYW5hZ2VyO1xuXG4gICAgcHJpdmF0ZSByZWFkb25seSBleHRlcm5hbENvbXBvbmVudE1hbmFnZXI6IEFwcEV4dGVybmFsQ29tcG9uZW50TWFuYWdlcjtcblxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NNYW5hZ2VyOiBBcHBTZXR0aW5nc01hbmFnZXI7XG5cbiAgICBwcml2YXRlIHJlYWRvbmx5IGxpY2Vuc2VNYW5hZ2VyOiBBcHBMaWNlbnNlTWFuYWdlcjtcblxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2NoZWR1bGVyTWFuYWdlcjogQXBwU2NoZWR1bGVyTWFuYWdlcjtcblxuICAgIHByaXZhdGUgcmVhZG9ubHkgdWlBY3Rpb25CdXR0b25NYW5hZ2VyOiBVSUFjdGlvbkJ1dHRvbk1hbmFnZXI7XG5cbiAgICBwcml2YXRlIHJlYWRvbmx5IHZpZGVvQ29uZlByb3ZpZGVyTWFuYWdlcjogQXBwVmlkZW9Db25mUHJvdmlkZXJNYW5hZ2VyO1xuXG4gICAgcHJpdmF0ZSByZWFkb25seSBzaWduYXR1cmVNYW5hZ2VyOiBBcHBTaWduYXR1cmVNYW5hZ2VyO1xuXG4gICAgcHJpdmF0ZSByZWFkb25seSBydW50aW1lOiBBcHBSdW50aW1lTWFuYWdlcjtcblxuICAgIHByaXZhdGUgaXNMb2FkZWQ6IGJvb2xlYW47XG5cbiAgICBjb25zdHJ1Y3Rvcih7IG1ldGFkYXRhU3RvcmFnZSwgbG9nU3RvcmFnZSwgYnJpZGdlcywgc291cmNlU3RvcmFnZSB9OiBJQXBwTWFuYWdlckRlcHMpIHtcbiAgICAgICAgLy8gU2luZ2xldG9uIHN0eWxlLiBUaGVyZSBjYW4gb25seSBldmVyIGJlIG9uZSBBcHBNYW5hZ2VyIGluc3RhbmNlXG4gICAgICAgIGlmICh0eXBlb2YgQXBwTWFuYWdlci5JbnN0YW5jZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlcmUgaXMgYWxyZWFkeSBhIHZhbGlkIEFwcE1hbmFnZXIgaW5zdGFuY2UnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChtZXRhZGF0YVN0b3JhZ2UgaW5zdGFuY2VvZiBBcHBNZXRhZGF0YVN0b3JhZ2UpIHtcbiAgICAgICAgICAgIHRoaXMuYXBwTWV0YWRhdGFTdG9yYWdlID0gbWV0YWRhdGFTdG9yYWdlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGluc3RhbmNlIG9mIHRoZSBBcHBNZXRhZGF0YVN0b3JhZ2UnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChsb2dTdG9yYWdlIGluc3RhbmNlb2YgQXBwTG9nU3RvcmFnZSkge1xuICAgICAgICAgICAgdGhpcy5sb2dTdG9yYWdlID0gbG9nU3RvcmFnZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBpbnN0YW5jZSBvZiB0aGUgQXBwTG9nU3RvcmFnZScpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGJyaWRnZXMgaW5zdGFuY2VvZiBBcHBCcmlkZ2VzKSB7XG4gICAgICAgICAgICB0aGlzLmJyaWRnZXMgPSBicmlkZ2VzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGluc3RhbmNlIG9mIHRoZSBBcHBCcmlkZ2VzJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc291cmNlU3RvcmFnZSBpbnN0YW5jZW9mIEFwcFNvdXJjZVN0b3JhZ2UpIHtcbiAgICAgICAgICAgIHRoaXMuYXBwU291cmNlU3RvcmFnZSA9IHNvdXJjZVN0b3JhZ2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgaW5zdGFuY2Ugb2YgdGhlIEFwcFNvdXJjZVN0b3JhZ2UnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuYXBwcyA9IG5ldyBNYXA8c3RyaW5nLCBQcm94aWVkQXBwPigpO1xuXG4gICAgICAgIHRoaXMucGFyc2VyID0gbmV3IEFwcFBhY2thZ2VQYXJzZXIoKTtcbiAgICAgICAgdGhpcy5jb21waWxlciA9IG5ldyBBcHBDb21waWxlcigpO1xuICAgICAgICB0aGlzLmFjY2Vzc29yTWFuYWdlciA9IG5ldyBBcHBBY2Nlc3Nvck1hbmFnZXIodGhpcyk7XG4gICAgICAgIHRoaXMubGlzdGVuZXJNYW5hZ2VyID0gbmV3IEFwcExpc3RlbmVyTWFuYWdlcih0aGlzKTtcbiAgICAgICAgdGhpcy5jb21tYW5kTWFuYWdlciA9IG5ldyBBcHBTbGFzaENvbW1hbmRNYW5hZ2VyKHRoaXMpO1xuICAgICAgICB0aGlzLmFwaU1hbmFnZXIgPSBuZXcgQXBwQXBpTWFuYWdlcih0aGlzKTtcbiAgICAgICAgdGhpcy5leHRlcm5hbENvbXBvbmVudE1hbmFnZXIgPSBuZXcgQXBwRXh0ZXJuYWxDb21wb25lbnRNYW5hZ2VyKCk7XG4gICAgICAgIHRoaXMuc2V0dGluZ3NNYW5hZ2VyID0gbmV3IEFwcFNldHRpbmdzTWFuYWdlcih0aGlzKTtcbiAgICAgICAgdGhpcy5saWNlbnNlTWFuYWdlciA9IG5ldyBBcHBMaWNlbnNlTWFuYWdlcih0aGlzKTtcbiAgICAgICAgdGhpcy5zY2hlZHVsZXJNYW5hZ2VyID0gbmV3IEFwcFNjaGVkdWxlck1hbmFnZXIodGhpcyk7XG4gICAgICAgIHRoaXMudWlBY3Rpb25CdXR0b25NYW5hZ2VyID0gbmV3IFVJQWN0aW9uQnV0dG9uTWFuYWdlcih0aGlzKTtcbiAgICAgICAgdGhpcy52aWRlb0NvbmZQcm92aWRlck1hbmFnZXIgPSBuZXcgQXBwVmlkZW9Db25mUHJvdmlkZXJNYW5hZ2VyKHRoaXMpO1xuICAgICAgICB0aGlzLnNpZ25hdHVyZU1hbmFnZXIgPSBuZXcgQXBwU2lnbmF0dXJlTWFuYWdlcih0aGlzKTtcbiAgICAgICAgdGhpcy5ydW50aW1lID0gbmV3IEFwcFJ1bnRpbWVNYW5hZ2VyKHRoaXMpO1xuXG4gICAgICAgIHRoaXMuaXNMb2FkZWQgPSBmYWxzZTtcbiAgICAgICAgQXBwTWFuYWdlci5JbnN0YW5jZSA9IHRoaXM7XG4gICAgfVxuXG4gICAgLyoqIEdldHMgdGhlIGluc3RhbmNlIG9mIHRoZSBzdG9yYWdlIGNvbm5lY3Rvci4gKi9cbiAgICBwdWJsaWMgZ2V0U3RvcmFnZSgpOiBBcHBNZXRhZGF0YVN0b3JhZ2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5hcHBNZXRhZGF0YVN0b3JhZ2U7XG4gICAgfVxuXG4gICAgLyoqIEdldHMgdGhlIGluc3RhbmNlIG9mIHRoZSBsb2cgc3RvcmFnZSBjb25uZWN0b3IuICovXG4gICAgcHVibGljIGdldExvZ1N0b3JhZ2UoKTogQXBwTG9nU3RvcmFnZSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxvZ1N0b3JhZ2U7XG4gICAgfVxuXG4gICAgLyoqIEdldHMgdGhlIGluc3RhbmNlIG9mIHRoZSBBcHAgcGFja2FnZSBwYXJzZXIuICovXG4gICAgcHVibGljIGdldFBhcnNlcigpOiBBcHBQYWNrYWdlUGFyc2VyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VyO1xuICAgIH1cblxuICAgIC8qKiBHZXRzIHRoZSBjb21waWxlciBpbnN0YW5jZS4gKi9cbiAgICBwdWJsaWMgZ2V0Q29tcGlsZXIoKTogQXBwQ29tcGlsZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5jb21waWxlcjtcbiAgICB9XG5cbiAgICAvKiogR2V0cyB0aGUgYWNjZXNzb3IgbWFuYWdlciBpbnN0YW5jZS4gKi9cbiAgICBwdWJsaWMgZ2V0QWNjZXNzb3JNYW5hZ2VyKCk6IEFwcEFjY2Vzc29yTWFuYWdlciB7XG4gICAgICAgIHJldHVybiB0aGlzLmFjY2Vzc29yTWFuYWdlcjtcbiAgICB9XG5cbiAgICAvKiogR2V0cyB0aGUgaW5zdGFuY2Ugb2YgdGhlIEJyaWRnZSBtYW5hZ2VyLiAqL1xuICAgIHB1YmxpYyBnZXRCcmlkZ2VzKCk6IEFwcEJyaWRnZXMge1xuICAgICAgICByZXR1cm4gdGhpcy5icmlkZ2VzO1xuICAgIH1cblxuICAgIC8qKiBHZXRzIHRoZSBpbnN0YW5jZSBvZiB0aGUgbGlzdGVuZXIgbWFuYWdlci4gKi9cbiAgICBwdWJsaWMgZ2V0TGlzdGVuZXJNYW5hZ2VyKCk6IEFwcExpc3RlbmVyTWFuYWdlciB7XG4gICAgICAgIHJldHVybiB0aGlzLmxpc3RlbmVyTWFuYWdlcjtcbiAgICB9XG5cbiAgICAvKiogR2V0cyB0aGUgY29tbWFuZCBtYW5hZ2VyJ3MgaW5zdGFuY2UuICovXG4gICAgcHVibGljIGdldENvbW1hbmRNYW5hZ2VyKCk6IEFwcFNsYXNoQ29tbWFuZE1hbmFnZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5jb21tYW5kTWFuYWdlcjtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0VmlkZW9Db25mUHJvdmlkZXJNYW5hZ2VyKCk6IEFwcFZpZGVvQ29uZlByb3ZpZGVyTWFuYWdlciB7XG4gICAgICAgIHJldHVybiB0aGlzLnZpZGVvQ29uZlByb3ZpZGVyTWFuYWdlcjtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0TGljZW5zZU1hbmFnZXIoKTogQXBwTGljZW5zZU1hbmFnZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5saWNlbnNlTWFuYWdlcjtcbiAgICB9XG5cbiAgICAvKiogR2V0cyB0aGUgYXBpIG1hbmFnZXIncyBpbnN0YW5jZS4gKi9cbiAgICBwdWJsaWMgZ2V0QXBpTWFuYWdlcigpOiBBcHBBcGlNYW5hZ2VyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpTWFuYWdlcjtcbiAgICB9XG5cbiAgICAvKiogR2V0cyB0aGUgZXh0ZXJuYWwgY29tcG9uZW50IG1hbmFnZXIncyBpbnN0YW5jZS4gKi9cbiAgICBwdWJsaWMgZ2V0RXh0ZXJuYWxDb21wb25lbnRNYW5hZ2VyKCk6IEFwcEV4dGVybmFsQ29tcG9uZW50TWFuYWdlciB7XG4gICAgICAgIHJldHVybiB0aGlzLmV4dGVybmFsQ29tcG9uZW50TWFuYWdlcjtcbiAgICB9XG5cbiAgICAvKiogR2V0cyB0aGUgbWFuYWdlciBvZiB0aGUgc2V0dGluZ3MsIHVwZGF0ZXMgYW5kIGdldHRpbmcuICovXG4gICAgcHVibGljIGdldFNldHRpbmdzTWFuYWdlcigpOiBBcHBTZXR0aW5nc01hbmFnZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5zZXR0aW5nc01hbmFnZXI7XG4gICAgfVxuXG4gICAgcHVibGljIGdldFNjaGVkdWxlck1hbmFnZXIoKTogQXBwU2NoZWR1bGVyTWFuYWdlciB7XG4gICAgICAgIHJldHVybiB0aGlzLnNjaGVkdWxlck1hbmFnZXI7XG4gICAgfVxuXG4gICAgcHVibGljIGdldFVJQWN0aW9uQnV0dG9uTWFuYWdlcigpOiBVSUFjdGlvbkJ1dHRvbk1hbmFnZXIge1xuICAgICAgICByZXR1cm4gdGhpcy51aUFjdGlvbkJ1dHRvbk1hbmFnZXI7XG4gICAgfVxuXG4gICAgcHVibGljIGdldFNpZ25hdHVyZU1hbmFnZXIoKTogQXBwU2lnbmF0dXJlTWFuYWdlciB7XG4gICAgICAgIHJldHVybiB0aGlzLnNpZ25hdHVyZU1hbmFnZXI7XG4gICAgfVxuXG4gICAgcHVibGljIGdldFJ1bnRpbWUoKTogQXBwUnVudGltZU1hbmFnZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5ydW50aW1lO1xuICAgIH1cblxuICAgIC8qKiBHZXRzIHdoZXRoZXIgdGhlIEFwcHMgaGF2ZSBiZWVuIGxvYWRlZCBvciBub3QuICovXG4gICAgcHVibGljIGFyZUFwcHNMb2FkZWQoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLmlzTG9hZGVkO1xuICAgIH1cblxuICAgIHB1YmxpYyBzZXRTb3VyY2VTdG9yYWdlKHN0b3JhZ2U6IEFwcFNvdXJjZVN0b3JhZ2UpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5hcHBTb3VyY2VTdG9yYWdlID0gc3RvcmFnZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHb2VzIHRocm91Z2ggdGhlIGVudGlyZSBsb2FkaW5nIHVwIHByb2Nlc3MuXG4gICAgICogRXhwZWN0IHRoaXMgdG8gdGFrZSBzb21lIHRpbWUsIGFzIGl0IGdvZXMgdGhyb3VnaCBhIHZlcnlcbiAgICAgKiBsb25nIHByb2Nlc3Mgb2YgbG9hZGluZyBhbGwgdGhlIEFwcHMgdXAuXG4gICAgICovXG4gICAgcHVibGljIGFzeW5jIGxvYWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIC8vIFlvdSBjYW4gbm90IGxvYWQgdGhlIEFwcE1hbmFnZXIgc3lzdGVtIGFnYWluXG4gICAgICAgIC8vIGlmIGl0IGhhcyBhbHJlYWR5IGJlZW4gbG9hZGVkLlxuICAgICAgICBpZiAodGhpcy5pc0xvYWRlZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpdGVtczogTWFwPHN0cmluZywgSUFwcFN0b3JhZ2VJdGVtPiA9IGF3YWl0IHRoaXMuYXBwTWV0YWRhdGFTdG9yYWdlLnJldHJpZXZlQWxsKCk7XG5cbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIGl0ZW1zLnZhbHVlcygpKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFwcFBhY2thZ2UgPSBhd2FpdCB0aGlzLmFwcFNvdXJjZVN0b3JhZ2UuZmV0Y2goaXRlbSk7XG4gICAgICAgICAgICAgICAgY29uc3QgdW5wYWNrYWdlUmVzdWx0ID0gYXdhaXQgdGhpcy5nZXRQYXJzZXIoKS51bnBhY2thZ2VBcHAoYXBwUGFja2FnZSk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBhcHAgPSBhd2FpdCB0aGlzLmdldENvbXBpbGVyKCkudG9TYW5kQm94KHRoaXMsIGl0ZW0sIHVucGFja2FnZVJlc3VsdCk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmFwcHMuc2V0KGl0ZW0uaWQsIGFwcCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBFcnJvciB3aGlsZSBjb21waWxpbmcgdGhlIEFwcCBcIiR7aXRlbS5pbmZvLm5hbWV9ICgke2l0ZW0uaWR9KVwiOmApO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBwcmwgPSBuZXcgUHJveGllZEFwcCh0aGlzLCBpdGVtLCB7XG4gICAgICAgICAgICAgICAgICAgIC8vIE1heWJlIHdlIHNob3VsZCBoYXZlIGFuIFwiRW1wdHlSdW50aW1lXCIgY2xhc3MgZm9yIHRoaXM/XG4gICAgICAgICAgICAgICAgICAgIGdldFN0YXR1cygpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBBcHBTdGF0dXMuQ09NUElMRVJfRVJST1JfRElTQUJMRUQ7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSBhcyB1bmtub3duIGFzIERlbm9SdW50aW1lU3VicHJvY2Vzc0NvbnRyb2xsZXIpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5hcHBzLnNldChpdGVtLmlkLCBwcmwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5pc0xvYWRlZCA9IHRydWU7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBlbmFibGVBbGwoKTogUHJvbWlzZTxBcnJheTxBcHBGYWJyaWNhdGlvbkZ1bGZpbGxtZW50Pj4ge1xuICAgICAgICBjb25zdCBhZmZzOiBBcnJheTxBcHBGYWJyaWNhdGlvbkZ1bGZpbGxtZW50PiA9IFtdO1xuXG4gICAgICAgIC8vIExldCdzIGluaXRpYWxpemUgdGhlbVxuICAgICAgICBmb3IgKGNvbnN0IHJsIG9mIHRoaXMuYXBwcy52YWx1ZXMoKSkge1xuICAgICAgICAgICAgY29uc3QgYWZmID0gbmV3IEFwcEZhYnJpY2F0aW9uRnVsZmlsbG1lbnQoKTtcblxuICAgICAgICAgICAgYWZmLnNldEFwcEluZm8ocmwuZ2V0SW5mbygpKTtcbiAgICAgICAgICAgIGFmZi5zZXRJbXBsZW1lbnRlZEludGVyZmFjZXMocmwuZ2V0SW1wbGVtZW50YXRpb25MaXN0KCkpO1xuICAgICAgICAgICAgYWZmLnNldEFwcChybCk7XG4gICAgICAgICAgICBhZmZzLnB1c2goYWZmKTtcblxuICAgICAgICAgICAgaWYgKEFwcFN0YXR1c1V0aWxzLmlzRGlzYWJsZWQoYXdhaXQgcmwuZ2V0U3RhdHVzKCkpKSB7XG4gICAgICAgICAgICAgICAgLy8gVXN1YWxseSBpZiBhbiBBcHAgaXMgZGlzYWJsZWQgYmVmb3JlIGl0J3MgaW5pdGlhbGl6ZWQsXG4gICAgICAgICAgICAgICAgLy8gdGhlbiBzb21ldGhpbmcgKHN1Y2ggYXMgYW4gZXJyb3IpIG9jY3VyZWQgd2hpbGVcbiAgICAgICAgICAgICAgICAvLyBpdCB3YXMgY29tcGlsZWQgb3Igc29tZXRoaW5nIHNpbWlsYXIuXG4gICAgICAgICAgICAgICAgLy8gV2Ugc3RpbGwgaGF2ZSB0byB2YWxpZGF0ZSBpdHMgbGljZW5zZSwgdGhvdWdoXG4gICAgICAgICAgICAgICAgYXdhaXQgcmwudmFsaWRhdGVMaWNlbnNlKCk7XG5cbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXdhaXQgdGhpcy5pbml0aWFsaXplQXBwKHJsLmdldFN0b3JhZ2VJdGVtKCksIHJsLCBmYWxzZSwgdHJ1ZSkuY2F0Y2goY29uc29sZS5lcnJvcik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBMZXQncyBlbnN1cmUgdGhlIHJlcXVpcmVkIHNldHRpbmdzIGFyZSBhbGwgc2V0XG4gICAgICAgIGZvciAoY29uc3Qgcmwgb2YgdGhpcy5hcHBzLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBpZiAoQXBwU3RhdHVzVXRpbHMuaXNEaXNhYmxlZChhd2FpdCBybC5nZXRTdGF0dXMoKSkpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCF0aGlzLmFyZVJlcXVpcmVkU2V0dGluZ3NTZXQocmwuZ2V0U3RvcmFnZUl0ZW0oKSkpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBybC5zZXRTdGF0dXMoQXBwU3RhdHVzLklOVkFMSURfU0VUVElOR1NfRElTQUJMRUQpLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gTm93IGxldCdzIGVuYWJsZSB0aGUgYXBwcyB3aGljaCB3ZXJlIG9uY2UgZW5hYmxlZFxuICAgICAgICAvLyBidXQgYXJlIG5vdCBjdXJyZW50bHkgZGlzYWJsZWQuXG4gICAgICAgIGZvciAoY29uc3QgYXBwIG9mIHRoaXMuYXBwcy52YWx1ZXMoKSkge1xuICAgICAgICAgICAgY29uc3Qgc3RhdHVzID0gYXdhaXQgYXBwLmdldFN0YXR1cygpO1xuICAgICAgICAgICAgaWYgKCFBcHBTdGF0dXNVdGlscy5pc0Rpc2FibGVkKHN0YXR1cykgJiYgQXBwU3RhdHVzVXRpbHMuaXNFbmFibGVkKGFwcC5nZXRQcmV2aW91c1N0YXR1cygpKSkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuZW5hYmxlQXBwKGFwcC5nZXRTdG9yYWdlSXRlbSgpLCBhcHAsIHRydWUsIGFwcC5nZXRQcmV2aW91c1N0YXR1cygpID09PSBBcHBTdGF0dXMuTUFOVUFMTFlfRU5BQkxFRCkuY2F0Y2goY29uc29sZS5lcnJvcik7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCFBcHBTdGF0dXNVdGlscy5pc0Vycm9yKHN0YXR1cykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxpc3RlbmVyTWFuYWdlci5sb2NrRXNzZW50aWFsRXZlbnRzKGFwcCk7XG4gICAgICAgICAgICAgICAgdGhpcy51aUFjdGlvbkJ1dHRvbk1hbmFnZXIuY2xlYXJBcHBBY3Rpb25CdXR0b25zKGFwcC5nZXRJRCgpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBhZmZzO1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyB1bmxvYWQoaXNNYW51YWw6IGJvb2xlYW4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgLy8gSWYgdGhlIEFwcE1hbmFnZXIgaGFzbid0IGJlZW4gbG9hZGVkIHlldCwgdGhlblxuICAgICAgICAvLyB0aGVyZSBpcyBub3RoaW5nIHRvIHVubG9hZFxuICAgICAgICBpZiAoIXRoaXMuaXNMb2FkZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoY29uc3QgYXBwIG9mIHRoaXMuYXBwcy52YWx1ZXMoKSkge1xuICAgICAgICAgICAgY29uc3Qgc3RhdHVzID0gYXdhaXQgYXBwLmdldFN0YXR1cygpO1xuICAgICAgICAgICAgaWYgKHN0YXR1cyA9PT0gQXBwU3RhdHVzLklOSVRJQUxJWkVEKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wdXJnZUFwcENvbmZpZyhhcHApO1xuICAgICAgICAgICAgfSBlbHNlIGlmICghQXBwU3RhdHVzVXRpbHMuaXNEaXNhYmxlZChzdGF0dXMpKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5kaXNhYmxlKGFwcC5nZXRJRCgpLCBpc01hbnVhbCA/IEFwcFN0YXR1cy5NQU5VQUxMWV9ESVNBQkxFRCA6IEFwcFN0YXR1cy5ESVNBQkxFRCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXJNYW5hZ2VyLnJlbGVhc2VFc3NlbnRpYWxFdmVudHMoYXBwKTtcblxuICAgICAgICAgICAgYXBwLmdldERlbm9SdW50aW1lKCkuc3RvcEFwcCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVtb3ZlIGFsbCB0aGUgYXBwcyBmcm9tIHRoZSBzeXN0ZW0gbm93IHRoYXQgd2UgaGF2ZSB1bmxvYWRlZCBldmVyeXRoaW5nXG4gICAgICAgIHRoaXMuYXBwcy5jbGVhcigpO1xuXG4gICAgICAgIHRoaXMuaXNMb2FkZWQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICAvKiogR2V0cyB0aGUgQXBwcyB3aGljaCBtYXRjaCB0aGUgZmlsdGVyIHBhc3NlZCBpbi4gKi9cbiAgICBwdWJsaWMgYXN5bmMgZ2V0KGZpbHRlcj86IElHZXRBcHBzRmlsdGVyKTogUHJvbWlzZTxQcm94aWVkQXBwW10+IHtcbiAgICAgICAgbGV0IHJsczogQXJyYXk8UHJveGllZEFwcD4gPSBbXTtcblxuICAgICAgICBpZiAodHlwZW9mIGZpbHRlciA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRoaXMuYXBwcy5mb3JFYWNoKChybCkgPT4gcmxzLnB1c2gocmwpKTtcblxuICAgICAgICAgICAgcmV0dXJuIHJscztcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBub3RoaW5nID0gdHJ1ZTtcblxuICAgICAgICBpZiAodHlwZW9mIGZpbHRlci5lbmFibGVkID09PSAnYm9vbGVhbicgJiYgZmlsdGVyLmVuYWJsZWQpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qgcmwgb2YgdGhpcy5hcHBzLnZhbHVlcygpKSB7XG4gICAgICAgICAgICAgICAgaWYgKEFwcFN0YXR1c1V0aWxzLmlzRW5hYmxlZChhd2FpdCBybC5nZXRTdGF0dXMoKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmxzLnB1c2gocmwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbm90aGluZyA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBmaWx0ZXIuZGlzYWJsZWQgPT09ICdib29sZWFuJyAmJiBmaWx0ZXIuZGlzYWJsZWQpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qgcmwgb2YgdGhpcy5hcHBzLnZhbHVlcygpKSB7XG4gICAgICAgICAgICAgICAgaWYgKEFwcFN0YXR1c1V0aWxzLmlzRGlzYWJsZWQoYXdhaXQgcmwuZ2V0U3RhdHVzKCkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJscy5wdXNoKHJsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG5vdGhpbmcgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChub3RoaW5nKSB7XG4gICAgICAgICAgICB0aGlzLmFwcHMuZm9yRWFjaCgocmwpID0+IHJscy5wdXNoKHJsKSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIGZpbHRlci5pZHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBybHMgPSBybHMuZmlsdGVyKChybCkgPT4gZmlsdGVyLmlkcy5pbmNsdWRlcyhybC5nZXRJRCgpKSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIGZpbHRlci5pbnN0YWxsYXRpb25Tb3VyY2UgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBybHMgPSBybHMuZmlsdGVyKChybCkgPT4gcmwuZ2V0SW5zdGFsbGF0aW9uU291cmNlKCkgPT09IGZpbHRlci5pbnN0YWxsYXRpb25Tb3VyY2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBmaWx0ZXIubmFtZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJscyA9IHJscy5maWx0ZXIoKHJsKSA9PiBybC5nZXROYW1lKCkgPT09IGZpbHRlci5uYW1lKTtcbiAgICAgICAgfSBlbHNlIGlmIChmaWx0ZXIubmFtZSBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgICAgICAgcmxzID0gcmxzLmZpbHRlcigocmwpID0+IChmaWx0ZXIubmFtZSBhcyBSZWdFeHApLnRlc3QocmwuZ2V0TmFtZSgpKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmxzO1xuICAgIH1cblxuICAgIC8qKiBHZXRzIGEgc2luZ2xlIEFwcCBieSB0aGUgaWQgcGFzc2VkIGluLiAqL1xuICAgIHB1YmxpYyBnZXRPbmVCeUlkKGFwcElkOiBzdHJpbmcpOiBQcm94aWVkQXBwIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBwcy5nZXQoYXBwSWQpO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRQZXJtaXNzaW9uc0J5SWQoYXBwSWQ6IHN0cmluZyk6IEFycmF5PElQZXJtaXNzaW9uPiB7XG4gICAgICAgIGNvbnN0IGFwcCA9IHRoaXMuYXBwcy5nZXQoYXBwSWQpO1xuXG4gICAgICAgIGlmICghYXBwKSB7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgeyBwZXJtaXNzaW9uc0dyYW50ZWQgfSA9IGFwcC5nZXRTdG9yYWdlSXRlbSgpO1xuXG4gICAgICAgIHJldHVybiBwZXJtaXNzaW9uc0dyYW50ZWQgfHwgZGVmYXVsdFBlcm1pc3Npb25zO1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBlbmFibGUoaWQ6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBjb25zdCBybCA9IHRoaXMuYXBwcy5nZXQoaWQpO1xuXG4gICAgICAgIGlmICghcmwpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gQXBwIGJ5IHRoZSBpZCBcIiR7aWR9XCIgZXhpc3RzLmApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc3RhdHVzID0gYXdhaXQgcmwuZ2V0U3RhdHVzKCk7XG5cbiAgICAgICAgaWYgKEFwcFN0YXR1c1V0aWxzLmlzRW5hYmxlZChzdGF0dXMpKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzdGF0dXMgPT09IEFwcFN0YXR1cy5DT01QSUxFUl9FUlJPUl9ESVNBQkxFRCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgQXBwIGhhZCBjb21waWxlciBlcnJvcnMsIGNhbiBub3QgZW5hYmxlIGl0LicpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc3RvcmFnZUl0ZW0gPSBhd2FpdCB0aGlzLmFwcE1ldGFkYXRhU3RvcmFnZS5yZXRyaWV2ZU9uZShpZCk7XG5cbiAgICAgICAgaWYgKCFzdG9yYWdlSXRlbSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDb3VsZCBub3QgZW5hYmxlIGFuIEFwcCB3aXRoIHRoZSBpZCBvZiBcIiR7aWR9XCIgYXMgaXQgZG9lc24ndCBleGlzdC5gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGlzU2V0dXAgPSBhd2FpdCB0aGlzLnJ1blN0YXJ0VXBQcm9jZXNzKHN0b3JhZ2VJdGVtLCBybCwgdHJ1ZSwgZmFsc2UpO1xuXG4gICAgICAgIGlmIChpc1NldHVwKSB7XG4gICAgICAgICAgICBzdG9yYWdlSXRlbS5zdGF0dXMgPSBhd2FpdCBybC5nZXRTdGF0dXMoKTtcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgYXN5bmMsIGJ1dCB3ZSBkb24ndCBjYXJlIHNpbmNlIGl0IG9ubHkgdXBkYXRlcyBpbiB0aGUgZGF0YWJhc2VcbiAgICAgICAgICAgIC8vIGFuZCBpdCBzaG91bGQgbm90IG11dGF0ZSBhbnkgcHJvcGVydGllcyB3ZSBjYXJlIGFib3V0XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmFwcE1ldGFkYXRhU3RvcmFnZS51cGRhdGUoc3RvcmFnZUl0ZW0pLmNhdGNoKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaXNTZXR1cDtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgZGlzYWJsZShpZDogc3RyaW5nLCBzdGF0dXM6IEFwcFN0YXR1cyA9IEFwcFN0YXR1cy5ESVNBQkxFRCwgc2lsZW50PzogYm9vbGVhbik6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBpZiAoIUFwcFN0YXR1c1V0aWxzLmlzRGlzYWJsZWQoc3RhdHVzKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGRpc2FibGVkIHN0YXR1cycpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYXBwID0gdGhpcy5hcHBzLmdldChpZCk7XG5cbiAgICAgICAgaWYgKCFhcHApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gQXBwIGJ5IHRoZSBpZCBcIiR7aWR9XCIgZXhpc3RzLmApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKEFwcFN0YXR1c1V0aWxzLmlzRW5hYmxlZChhd2FpdCBhcHAuZ2V0U3RhdHVzKCkpKSB7XG4gICAgICAgICAgICBhd2FpdCBhcHAuY2FsbChBcHBNZXRob2QuT05ESVNBQkxFKS5jYXRjaCgoZSkgPT4gY29uc29sZS53YXJuKCdFcnJvciB3aGlsZSBkaXNhYmxpbmc6JywgZSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgdGhpcy5wdXJnZUFwcENvbmZpZyhhcHAsIHsga2VlcFNjaGVkdWxlZEpvYnM6IHRydWUgfSk7XG5cbiAgICAgICAgYXdhaXQgYXBwLnNldFN0YXR1cyhzdGF0dXMsIHNpbGVudCk7XG5cbiAgICAgICAgY29uc3Qgc3RvcmFnZUl0ZW0gPSBhd2FpdCB0aGlzLmFwcE1ldGFkYXRhU3RvcmFnZS5yZXRyaWV2ZU9uZShpZCk7XG5cbiAgICAgICAgYXBwLmdldFN0b3JhZ2VJdGVtKCkubWFya2V0cGxhY2VJbmZvID0gc3RvcmFnZUl0ZW0ubWFya2V0cGxhY2VJbmZvO1xuICAgICAgICBhd2FpdCBhcHAudmFsaWRhdGVMaWNlbnNlKCkuY2F0Y2goKTtcblxuICAgICAgICBzdG9yYWdlSXRlbS5zdGF0dXMgPSBhd2FpdCBhcHAuZ2V0U3RhdHVzKCk7XG4gICAgICAgIC8vIFRoaXMgaXMgYXN5bmMsIGJ1dCB3ZSBkb24ndCBjYXJlIHNpbmNlIGl0IG9ubHkgdXBkYXRlcyBpbiB0aGUgZGF0YWJhc2VcbiAgICAgICAgLy8gYW5kIGl0IHNob3VsZCBub3QgbXV0YXRlIGFueSBwcm9wZXJ0aWVzIHdlIGNhcmUgYWJvdXRcbiAgICAgICAgYXdhaXQgdGhpcy5hcHBNZXRhZGF0YVN0b3JhZ2UudXBkYXRlKHN0b3JhZ2VJdGVtKS5jYXRjaCgpO1xuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBtaWdyYXRlKGlkOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgY29uc3QgYXBwID0gdGhpcy5hcHBzLmdldChpZCk7XG5cbiAgICAgICAgaWYgKCFhcHApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gQXBwIGJ5IHRoZSBpZCBcIiR7aWR9XCIgZXhpc3RzLmApO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgYXBwLmNhbGwoQXBwTWV0aG9kLk9OVVBEQVRFKS5jYXRjaCgoZSkgPT4gY29uc29sZS53YXJuKCdFcnJvciB3aGlsZSBtaWdyYXRpbmc6JywgZSkpO1xuXG4gICAgICAgIGF3YWl0IHRoaXMucHVyZ2VBcHBDb25maWcoYXBwLCB7IGtlZXBTY2hlZHVsZWRKb2JzOiB0cnVlIH0pO1xuXG4gICAgICAgIGNvbnN0IHN0b3JhZ2VJdGVtID0gYXdhaXQgdGhpcy5hcHBNZXRhZGF0YVN0b3JhZ2UucmV0cmlldmVPbmUoaWQpO1xuXG4gICAgICAgIGFwcC5nZXRTdG9yYWdlSXRlbSgpLm1hcmtldHBsYWNlSW5mbyA9IHN0b3JhZ2VJdGVtLm1hcmtldHBsYWNlSW5mbztcbiAgICAgICAgYXdhaXQgYXBwLnZhbGlkYXRlTGljZW5zZSgpLmNhdGNoKCk7XG5cbiAgICAgICAgc3RvcmFnZUl0ZW0ubWlncmF0ZWQgPSB0cnVlO1xuICAgICAgICBzdG9yYWdlSXRlbS5zaWduYXR1cmUgPSBhd2FpdCB0aGlzLmdldFNpZ25hdHVyZU1hbmFnZXIoKS5zaWduQXBwKHN0b3JhZ2VJdGVtKTtcbiAgICAgICAgLy8gVGhpcyBpcyBhc3luYywgYnV0IHdlIGRvbid0IGNhcmUgc2luY2UgaXQgb25seSB1cGRhdGVzIGluIHRoZSBkYXRhYmFzZVxuICAgICAgICAvLyBhbmQgaXQgc2hvdWxkIG5vdCBtdXRhdGUgYW55IHByb3BlcnRpZXMgd2UgY2FyZSBhYm91dFxuICAgICAgICBjb25zdCBzdG9yZWQgPSBhd2FpdCB0aGlzLmFwcE1ldGFkYXRhU3RvcmFnZS51cGRhdGUoc3RvcmFnZUl0ZW0pLmNhdGNoKCk7XG5cbiAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVMb2NhbChzdG9yZWQsIGFwcCk7XG4gICAgICAgIGF3YWl0IHRoaXMuYnJpZGdlc1xuICAgICAgICAgICAgLmdldEFwcEFjdGl2YXRpb25CcmlkZ2UoKVxuICAgICAgICAgICAgLmRvQXBwVXBkYXRlZChhcHApXG4gICAgICAgICAgICAuY2F0Y2goKCkgPT4ge30pO1xuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBhZGRMb2NhbChhcHBJZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IHN0b3JhZ2VJdGVtID0gYXdhaXQgdGhpcy5hcHBNZXRhZGF0YVN0b3JhZ2UucmV0cmlldmVPbmUoYXBwSWQpO1xuXG4gICAgICAgIGlmICghc3RvcmFnZUl0ZW0pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQXBwIHdpdGggaWQgJHthcHBJZH0gY291bGRuJ3QgYmUgZm91bmRgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGFwcFBhY2thZ2UgPSBhd2FpdCB0aGlzLmFwcFNvdXJjZVN0b3JhZ2UuZmV0Y2goc3RvcmFnZUl0ZW0pO1xuXG4gICAgICAgIGlmICghYXBwUGFja2FnZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBQYWNrYWdlIGZpbGUgZm9yIGFwcCBcIiR7c3RvcmFnZUl0ZW0uaW5mby5uYW1lfVwiICgke2FwcElkfSkgY291bGRuJ3QgYmUgZm91bmRgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHBhcnNlZFBhY2thZ2UgPSBhd2FpdCB0aGlzLmdldFBhcnNlcigpLnVucGFja2FnZUFwcChhcHBQYWNrYWdlKTtcbiAgICAgICAgY29uc3QgYXBwID0gYXdhaXQgdGhpcy5nZXRDb21waWxlcigpLnRvU2FuZEJveCh0aGlzLCBzdG9yYWdlSXRlbSwgcGFyc2VkUGFja2FnZSk7XG5cbiAgICAgICAgdGhpcy5hcHBzLnNldChhcHAuZ2V0SUQoKSwgYXBwKTtcblxuICAgICAgICBhd2FpdCB0aGlzLmxvYWRPbmUoYXBwSWQpO1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBhZGQoYXBwUGFja2FnZTogQnVmZmVyLCBpbnN0YWxsYXRpb25QYXJhbWV0ZXJzOiBJQXBwSW5zdGFsbFBhcmFtZXRlcnMpOiBQcm9taXNlPEFwcEZhYnJpY2F0aW9uRnVsZmlsbG1lbnQ+IHtcbiAgICAgICAgY29uc3QgeyBlbmFibGUgPSB0cnVlLCBtYXJrZXRwbGFjZUluZm8sIHBlcm1pc3Npb25zR3JhbnRlZCwgdXNlciB9ID0gaW5zdGFsbGF0aW9uUGFyYW1ldGVycztcblxuICAgICAgICBjb25zdCBhZmYgPSBuZXcgQXBwRmFicmljYXRpb25GdWxmaWxsbWVudCgpO1xuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmdldFBhcnNlcigpLnVucGFja2FnZUFwcChhcHBQYWNrYWdlKTtcbiAgICAgICAgY29uc3QgdW5kb1N0ZXBzOiBBcnJheTwoKSA9PiB2b2lkPiA9IFtdO1xuXG4gICAgICAgIGFmZi5zZXRBcHBJbmZvKHJlc3VsdC5pbmZvKTtcbiAgICAgICAgYWZmLnNldEltcGxlbWVudGVkSW50ZXJmYWNlcyhyZXN1bHQuaW1wbGVtZW50ZWQuZ2V0VmFsdWVzKCkpO1xuXG4gICAgICAgIGNvbnN0IGRlc2NyaXB0b3I6IElBcHBTdG9yYWdlSXRlbSA9IHtcbiAgICAgICAgICAgIGlkOiByZXN1bHQuaW5mby5pZCxcbiAgICAgICAgICAgIGluZm86IHJlc3VsdC5pbmZvLFxuICAgICAgICAgICAgc3RhdHVzOiBBcHBTdGF0dXMuVU5LTk9XTixcbiAgICAgICAgICAgIHNldHRpbmdzOiB7fSxcbiAgICAgICAgICAgIGltcGxlbWVudGVkOiByZXN1bHQuaW1wbGVtZW50ZWQuZ2V0VmFsdWVzKCksXG4gICAgICAgICAgICBpbnN0YWxsYXRpb25Tb3VyY2U6IG1hcmtldHBsYWNlSW5mbyA/IEFwcEluc3RhbGxhdGlvblNvdXJjZS5NQVJLRVRQTEFDRSA6IEFwcEluc3RhbGxhdGlvblNvdXJjZS5QUklWQVRFLFxuICAgICAgICAgICAgbWFya2V0cGxhY2VJbmZvLFxuICAgICAgICAgICAgcGVybWlzc2lvbnNHcmFudGVkLFxuICAgICAgICAgICAgbGFuZ3VhZ2VDb250ZW50OiByZXN1bHQubGFuZ3VhZ2VDb250ZW50LFxuICAgICAgICB9O1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBkZXNjcmlwdG9yLnNvdXJjZVBhdGggPSBhd2FpdCB0aGlzLmFwcFNvdXJjZVN0b3JhZ2Uuc3RvcmUoZGVzY3JpcHRvciwgYXBwUGFja2FnZSk7XG5cbiAgICAgICAgICAgIHVuZG9TdGVwcy5wdXNoKCgpID0+IHRoaXMuYXBwU291cmNlU3RvcmFnZS5yZW1vdmUoZGVzY3JpcHRvcikpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgYWZmLnNldFN0b3JhZ2VFcnJvcignRmFpbGVkIHRvIHN0b3JlIGFwcCBwYWNrYWdlJyk7XG5cbiAgICAgICAgICAgIHJldHVybiBhZmY7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBOb3cgdGhhdCBpcyBoYXMgYWxsIGJlZW4gY29tcGlsZWQsIGxldCdzIGdldCB0aGVcbiAgICAgICAgLy8gdGhlIEFwcCBpbnN0YW5jZSBmcm9tIHRoZSBzb3VyY2UuXG4gICAgICAgIGNvbnN0IGFwcCA9IGF3YWl0IHRoaXMuZ2V0Q29tcGlsZXIoKS50b1NhbmRCb3godGhpcywgZGVzY3JpcHRvciwgcmVzdWx0KTtcblxuICAgICAgICB1bmRvU3RlcHMucHVzaCgoKSA9PlxuICAgICAgICAgICAgdGhpcy5nZXRSdW50aW1lKClcbiAgICAgICAgICAgICAgICAuc3RvcFJ1bnRpbWUoYXBwLmdldERlbm9SdW50aW1lKCkpXG4gICAgICAgICAgICAgICAgLmNhdGNoKCgpID0+IHt9KSxcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBDcmVhdGUgYSB1c2VyIGZvciB0aGUgYXBwXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNyZWF0ZUFwcFVzZXIocmVzdWx0LmluZm8pO1xuXG4gICAgICAgICAgICB1bmRvU3RlcHMucHVzaCgoKSA9PiB0aGlzLnJlbW92ZUFwcFVzZXIoYXBwKSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgYWZmLnNldEFwcFVzZXJFcnJvcih7XG4gICAgICAgICAgICAgICAgdXNlcm5hbWU6IGAke3Jlc3VsdC5pbmZvLm5hbWVTbHVnfS5ib3RgLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdGYWlsZWQgdG8gY3JlYXRlIGFuIGFwcCB1c2VyIGZvciB0aGlzIGFwcC4nLFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGF3YWl0IFByb21pc2UuYWxsKHVuZG9TdGVwcy5tYXAoKHVuZG9lcikgPT4gdW5kb2VyKCkpKTtcblxuICAgICAgICAgICAgcmV0dXJuIGFmZjtcbiAgICAgICAgfVxuXG4gICAgICAgIGRlc2NyaXB0b3Iuc2lnbmF0dXJlID0gYXdhaXQgdGhpcy5nZXRTaWduYXR1cmVNYW5hZ2VyKCkuc2lnbkFwcChkZXNjcmlwdG9yKTtcbiAgICAgICAgY29uc3QgY3JlYXRlZCA9IGF3YWl0IHRoaXMuYXBwTWV0YWRhdGFTdG9yYWdlLmNyZWF0ZShkZXNjcmlwdG9yKTtcblxuICAgICAgICBpZiAoIWNyZWF0ZWQpIHtcbiAgICAgICAgICAgIGFmZi5zZXRTdG9yYWdlRXJyb3IoJ0ZhaWxlZCB0byBjcmVhdGUgdGhlIEFwcCwgdGhlIHN0b3JhZ2UgZGlkIG5vdCByZXR1cm4gaXQuJyk7XG5cbiAgICAgICAgICAgIGF3YWl0IFByb21pc2UuYWxsKHVuZG9TdGVwcy5tYXAoKHVuZG9lcikgPT4gdW5kb2VyKCkpKTtcblxuICAgICAgICAgICAgcmV0dXJuIGFmZjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuYXBwcy5zZXQoYXBwLmdldElEKCksIGFwcCk7XG4gICAgICAgIGFmZi5zZXRBcHAoYXBwKTtcblxuICAgICAgICAvLyBMZXQgZXZlcnlvbmUga25vdyB0aGF0IHRoZSBBcHAgaGFzIGJlZW4gYWRkZWRcbiAgICAgICAgYXdhaXQgdGhpcy5icmlkZ2VzXG4gICAgICAgICAgICAuZ2V0QXBwQWN0aXZhdGlvbkJyaWRnZSgpXG4gICAgICAgICAgICAuZG9BcHBBZGRlZChhcHApXG4gICAgICAgICAgICAuY2F0Y2goKCkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIElmIGFuIGVycm9yIG9jY3VycyBkdXJpbmcgdGhpcywgb2ggd2VsbC5cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIGF3YWl0IHRoaXMuaW5zdGFsbEFwcChjcmVhdGVkLCBhcHAsIHVzZXIpO1xuXG4gICAgICAgIC8vIFNob3VsZCBlbmFibGUgPT09IHRydWUsIHRoZW4gd2UgZ28gdGhyb3VnaCB0aGUgZW50aXJlIHN0YXJ0IHVwIHByb2Nlc3NcbiAgICAgICAgLy8gT3RoZXJ3aXNlLCB3ZSBvbmx5IGluaXRpYWxpemUgaXQuXG4gICAgICAgIGlmIChlbmFibGUpIHtcbiAgICAgICAgICAgIC8vIFN0YXJ0IHVwIHRoZSBhcHBcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucnVuU3RhcnRVcFByb2Nlc3MoY3JlYXRlZCwgYXBwLCBmYWxzZSwgZmFsc2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5pbml0aWFsaXplQXBwKGNyZWF0ZWQsIGFwcCwgdHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYWZmO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVuaW5zdGFsbHMgc3BlY2lmaWVkIGFwcCBmcm9tIHRoZSBzZXJ2ZXIgYW5kIHJlbW92ZVxuICAgICAqIGFsbCBkYXRhYmFzZSByZWNvcmRzIHJlZ2FyZGluZyBpdFxuICAgICAqXG4gICAgICogQHJldHVybnMgdGhlIGluc3RhbmNlIG9mIHRoZSByZW1vdmVkIFByb3hpZWRBcHBcbiAgICAgKi9cbiAgICBwdWJsaWMgYXN5bmMgcmVtb3ZlKGlkOiBzdHJpbmcsIHVuaW5zdGFsbGF0aW9uUGFyYW1ldGVyczogSUFwcFVuaW5zdGFsbFBhcmFtZXRlcnMpOiBQcm9taXNlPFByb3hpZWRBcHA+IHtcbiAgICAgICAgY29uc3QgYXBwID0gdGhpcy5hcHBzLmdldChpZCk7XG4gICAgICAgIGNvbnN0IHsgdXNlciB9ID0gdW5pbnN0YWxsYXRpb25QYXJhbWV0ZXJzO1xuXG4gICAgICAgIC8vIEZpcnN0IHJlbW92ZSB0aGUgYXBwXG4gICAgICAgIGF3YWl0IHRoaXMudW5pbnN0YWxsQXBwKGFwcCwgdXNlcik7XG4gICAgICAgIGF3YWl0IHRoaXMucmVtb3ZlTG9jYWwoaWQpO1xuXG4gICAgICAgIC8vIFRoZW4gbGV0IGV2ZXJ5b25lIGtub3cgdGhhdCB0aGUgQXBwIGhhcyBiZWVuIHJlbW92ZWRcbiAgICAgICAgYXdhaXQgdGhpcy5icmlkZ2VzLmdldEFwcEFjdGl2YXRpb25CcmlkZ2UoKS5kb0FwcFJlbW92ZWQoYXBwKS5jYXRjaCgpO1xuXG4gICAgICAgIHJldHVybiBhcHA7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyB0aGUgYXBwIGluc3RhbmNlIGZyb20gdGhlIGxvY2FsIEFwcHMgY29udGFpbmVyXG4gICAgICogYW5kIGV2ZXJ5IHR5cGUgb2YgZGF0YSBhc3NvY2lhdGVkIHdpdGggaXRcbiAgICAgKi9cbiAgICBwdWJsaWMgYXN5bmMgcmVtb3ZlTG9jYWwoaWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCBhcHAgPSB0aGlzLmFwcHMuZ2V0KGlkKTtcblxuICAgICAgICBpZiAoQXBwU3RhdHVzVXRpbHMuaXNFbmFibGVkKGF3YWl0IGFwcC5nZXRTdGF0dXMoKSkpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuZGlzYWJsZShpZCk7XG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCB0aGlzLnB1cmdlQXBwQ29uZmlnKGFwcCk7XG4gICAgICAgIHRoaXMubGlzdGVuZXJNYW5hZ2VyLnJlbGVhc2VFc3NlbnRpYWxFdmVudHMoYXBwKTtcbiAgICAgICAgYXdhaXQgdGhpcy5yZW1vdmVBcHBVc2VyKGFwcCk7XG4gICAgICAgIGF3YWl0ICh0aGlzLmJyaWRnZXMuZ2V0UGVyc2lzdGVuY2VCcmlkZ2UoKSBhcyBJSW50ZXJuYWxQZXJzaXN0ZW5jZUJyaWRnZSAmIFBlcnNpc3RlbmNlQnJpZGdlKS5wdXJnZShhcHAuZ2V0SUQoKSk7XG4gICAgICAgIGF3YWl0IHRoaXMuYXBwTWV0YWRhdGFTdG9yYWdlLnJlbW92ZShhcHAuZ2V0SUQoKSk7XG4gICAgICAgIGF3YWl0IHRoaXMuYXBwU291cmNlU3RvcmFnZS5yZW1vdmUoYXBwLmdldFN0b3JhZ2VJdGVtKCkpLmNhdGNoKCgpID0+IHt9KTtcblxuICAgICAgICAvLyBFcnJvcnMgaGVyZSBkb24ndCByZWFsbHkgcHJldmVudCB0aGUgcHJvY2VzcyBmcm9tIGR5aW5nLCBzbyB3ZSBkb24ndCByZWFsbHkgbmVlZCB0byBkbyBhbnl0aGluZyBvbiB0aGUgY2F0Y2hcbiAgICAgICAgYXdhaXQgdGhpcy5nZXRSdW50aW1lKClcbiAgICAgICAgICAgIC5zdG9wUnVudGltZShhcHAuZ2V0RGVub1J1bnRpbWUoKSlcbiAgICAgICAgICAgIC5jYXRjaCgoKSA9PiB7fSk7XG5cbiAgICAgICAgdGhpcy5hcHBzLmRlbGV0ZShhcHAuZ2V0SUQoKSk7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIHVwZGF0ZShcbiAgICAgICAgYXBwUGFja2FnZTogQnVmZmVyLFxuICAgICAgICBwZXJtaXNzaW9uc0dyYW50ZWQ6IEFycmF5PElQZXJtaXNzaW9uPixcbiAgICAgICAgdXBkYXRlT3B0aW9uczogeyBsb2FkQXBwPzogYm9vbGVhbjsgdXNlcj86IElVc2VyIH0gPSB7IGxvYWRBcHA6IHRydWUgfSxcbiAgICApOiBQcm9taXNlPEFwcEZhYnJpY2F0aW9uRnVsZmlsbG1lbnQ+IHtcbiAgICAgICAgY29uc3QgYWZmID0gbmV3IEFwcEZhYnJpY2F0aW9uRnVsZmlsbG1lbnQoKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5nZXRQYXJzZXIoKS51bnBhY2thZ2VBcHAoYXBwUGFja2FnZSk7XG5cbiAgICAgICAgYWZmLnNldEFwcEluZm8ocmVzdWx0LmluZm8pO1xuICAgICAgICBhZmYuc2V0SW1wbGVtZW50ZWRJbnRlcmZhY2VzKHJlc3VsdC5pbXBsZW1lbnRlZC5nZXRWYWx1ZXMoKSk7XG5cbiAgICAgICAgY29uc3Qgb2xkID0gYXdhaXQgdGhpcy5hcHBNZXRhZGF0YVN0b3JhZ2UucmV0cmlldmVPbmUocmVzdWx0LmluZm8uaWQpO1xuXG4gICAgICAgIGlmICghb2xkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NhbiBub3QgdXBkYXRlIGFuIEFwcCB0aGF0IGRvZXMgbm90IGN1cnJlbnRseSBleGlzdC4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHRoZXJlIGlzIGFueSBlcnJvciBkdXJpbmcgZGlzYWJsaW5nLCBpdCBkb2Vzbid0IHJlYWxseSBtYXR0ZXJcbiAgICAgICAgYXdhaXQgdGhpcy5kaXNhYmxlKG9sZC5pZCkuY2F0Y2goKCkgPT4ge30pO1xuXG4gICAgICAgIGNvbnN0IGRlc2NyaXB0b3I6IElBcHBTdG9yYWdlSXRlbSA9IHtcbiAgICAgICAgICAgIC4uLm9sZCxcbiAgICAgICAgICAgIGNyZWF0ZWRBdDogb2xkLmNyZWF0ZWRBdCxcbiAgICAgICAgICAgIGlkOiByZXN1bHQuaW5mby5pZCxcbiAgICAgICAgICAgIGluZm86IHJlc3VsdC5pbmZvLFxuICAgICAgICAgICAgc3RhdHVzOiAoYXdhaXQgdGhpcy5hcHBzLmdldChvbGQuaWQpPy5nZXRTdGF0dXMoKSkgfHwgb2xkLnN0YXR1cyxcbiAgICAgICAgICAgIGxhbmd1YWdlQ29udGVudDogcmVzdWx0Lmxhbmd1YWdlQ29udGVudCxcbiAgICAgICAgICAgIHNldHRpbmdzOiBvbGQuc2V0dGluZ3MsXG4gICAgICAgICAgICBpbXBsZW1lbnRlZDogcmVzdWx0LmltcGxlbWVudGVkLmdldFZhbHVlcygpLFxuICAgICAgICAgICAgbWFya2V0cGxhY2VJbmZvOiBvbGQubWFya2V0cGxhY2VJbmZvLFxuICAgICAgICAgICAgc291cmNlUGF0aDogb2xkLnNvdXJjZVBhdGgsXG4gICAgICAgICAgICBwZXJtaXNzaW9uc0dyYW50ZWQsXG4gICAgICAgIH07XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGRlc2NyaXB0b3Iuc291cmNlUGF0aCA9IGF3YWl0IHRoaXMuYXBwU291cmNlU3RvcmFnZS51cGRhdGUoZGVzY3JpcHRvciwgYXBwUGFja2FnZSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBhZmYuc2V0U3RvcmFnZUVycm9yKCdGYWlsZWQgdG8gc3RvcmFnZSBhcHAgcGFja2FnZScpO1xuXG4gICAgICAgICAgICByZXR1cm4gYWZmO1xuICAgICAgICB9XG5cbiAgICAgICAgZGVzY3JpcHRvci5zaWduYXR1cmUgPSBhd2FpdCB0aGlzLnNpZ25hdHVyZU1hbmFnZXIuc2lnbkFwcChkZXNjcmlwdG9yKTtcbiAgICAgICAgY29uc3Qgc3RvcmVkID0gYXdhaXQgdGhpcy5hcHBNZXRhZGF0YVN0b3JhZ2UudXBkYXRlKGRlc2NyaXB0b3IpO1xuXG4gICAgICAgIC8vIEVycm9ycyBoZXJlIGRvbid0IHJlYWxseSBwcmV2ZW50IHRoZSBwcm9jZXNzIGZyb20gZHlpbmcsIHNvIHdlIGRvbid0IHJlYWxseSBuZWVkIHRvIGRvIGFueXRoaW5nIG9uIHRoZSBjYXRjaFxuICAgICAgICBhd2FpdCB0aGlzLmdldFJ1bnRpbWUoKVxuICAgICAgICAgICAgLnN0b3BSdW50aW1lKHRoaXMuYXBwcy5nZXQob2xkLmlkKS5nZXREZW5vUnVudGltZSgpKVxuICAgICAgICAgICAgLmNhdGNoKCgpID0+IHt9KTtcblxuICAgICAgICBjb25zdCBhcHAgPSBhd2FpdCB0aGlzLmdldENvbXBpbGVyKCkudG9TYW5kQm94KHRoaXMsIGRlc2NyaXB0b3IsIHJlc3VsdCk7XG5cbiAgICAgICAgLy8gRW5zdXJlIHRoZXJlIGlzIGFuIHVzZXIgZm9yIHRoZSBhcHBcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY3JlYXRlQXBwVXNlcihyZXN1bHQuaW5mbyk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgYWZmLnNldEFwcFVzZXJFcnJvcih7XG4gICAgICAgICAgICAgICAgdXNlcm5hbWU6IGAke3Jlc3VsdC5pbmZvLm5hbWVTbHVnfS5ib3RgLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdGYWlsZWQgdG8gY3JlYXRlIGFuIGFwcCB1c2VyIGZvciB0aGlzIGFwcC4nLFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiBhZmY7XG4gICAgICAgIH1cblxuICAgICAgICBhZmYuc2V0QXBwKGFwcCk7XG5cbiAgICAgICAgaWYgKHVwZGF0ZU9wdGlvbnMubG9hZEFwcCkge1xuICAgICAgICAgICAgY29uc3Qgc2hvdWxkRW5hYmxlQXBwID0gQXBwU3RhdHVzVXRpbHMuaXNFbmFibGVkKG9sZC5zdGF0dXMpO1xuICAgICAgICAgICAgaWYgKHNob3VsZEVuYWJsZUFwcCkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMudXBkYXRlQW5kU3RhcnR1cExvY2FsKHN0b3JlZCwgYXBwKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVBbmRJbml0aWFsaXplTG9jYWwoc3RvcmVkLCBhcHApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmJyaWRnZXNcbiAgICAgICAgICAgICAgICAuZ2V0QXBwQWN0aXZhdGlvbkJyaWRnZSgpXG4gICAgICAgICAgICAgICAgLmRvQXBwVXBkYXRlZChhcHApXG4gICAgICAgICAgICAgICAgLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IHRoaXMudXBkYXRlQXBwKGFwcCwgdXBkYXRlT3B0aW9ucy51c2VyLCBvbGQuaW5mby52ZXJzaW9uKTtcblxuICAgICAgICByZXR1cm4gYWZmO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZXMgdGhlIGxvY2FsIGluc3RhbmNlIG9mIGFuIGFwcC5cbiAgICAgKlxuICAgICAqIElmIHRoZSBzZWNvbmQgcGFyYW1ldGVyIGlzIGEgQnVmZmVyIG9mIGFuIGFwcCBwYWNrYWdlLFxuICAgICAqIHVucGFja2FnZSBhbmQgaW5zdGFudGlhdGUgdGhlIGFwcCdzIG1haW4gY2xhc3NcbiAgICAgKlxuICAgICAqIFdpdGggYW4gaW5zdGFuY2Ugb2YgYSBQcm94aWVkQXBwLCBzdGFydCBpdCB1cCBhbmQgcmVwbGFjZVxuICAgICAqIHRoZSByZWZlcmVuY2UgaW4gdGhlIGxvY2FsIGFwcCBjb2xsZWN0aW9uXG4gICAgICovXG4gICAgYXN5bmMgdXBkYXRlTG9jYWwoc3RvcmVkOiBJQXBwU3RvcmFnZUl0ZW0sIGFwcFBhY2thZ2VPckluc3RhbmNlOiBQcm94aWVkQXBwIHwgQnVmZmVyKTogUHJvbWlzZTxQcm94aWVkQXBwPiB7XG4gICAgICAgIGNvbnN0IGFwcCA9IGF3YWl0IChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoYXBwUGFja2FnZU9ySW5zdGFuY2UgaW5zdGFuY2VvZiBCdWZmZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJzZVJlc3VsdCA9IGF3YWl0IHRoaXMuZ2V0UGFyc2VyKCkudW5wYWNrYWdlQXBwKGFwcFBhY2thZ2VPckluc3RhbmNlKTtcblxuICAgICAgICAgICAgICAgIC8vIEVycm9ycyBoZXJlIGRvbid0IHJlYWxseSBwcmV2ZW50IHRoZSBwcm9jZXNzIGZyb20gZHlpbmcsIHNvIHdlIGRvbid0IHJlYWxseSBuZWVkIHRvIGRvIGFueXRoaW5nIG9uIHRoZSBjYXRjaFxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuZ2V0UnVudGltZSgpXG4gICAgICAgICAgICAgICAgICAgIC5zdG9wUnVudGltZSh0aGlzLmFwcHMuZ2V0KHN0b3JlZC5pZCkuZ2V0RGVub1J1bnRpbWUoKSlcbiAgICAgICAgICAgICAgICAgICAgLmNhdGNoKCgpID0+IHt9KTtcblxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldENvbXBpbGVyKCkudG9TYW5kQm94KHRoaXMsIHN0b3JlZCwgcGFyc2VSZXN1bHQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gYXBwUGFja2FnZU9ySW5zdGFuY2U7XG4gICAgICAgIH0pKCk7XG5cbiAgICAgICAgYXdhaXQgdGhpcy5wdXJnZUFwcENvbmZpZyhhcHAsIHsga2VlcFNjaGVkdWxlZEpvYnM6IHRydWUgfSk7XG5cbiAgICAgICAgdGhpcy5hcHBzLnNldChhcHAuZ2V0SUQoKSwgYXBwKTtcbiAgICAgICAgcmV0dXJuIGFwcDtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgdXBkYXRlQW5kU3RhcnR1cExvY2FsKHN0b3JlZDogSUFwcFN0b3JhZ2VJdGVtLCBhcHBQYWNrYWdlT3JJbnN0YW5jZTogUHJveGllZEFwcCB8IEJ1ZmZlcikge1xuICAgICAgICBjb25zdCBhcHAgPSBhd2FpdCB0aGlzLnVwZGF0ZUxvY2FsKHN0b3JlZCwgYXBwUGFja2FnZU9ySW5zdGFuY2UpO1xuICAgICAgICBhd2FpdCB0aGlzLnJ1blN0YXJ0VXBQcm9jZXNzKHN0b3JlZCwgYXBwLCBmYWxzZSwgdHJ1ZSk7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIHVwZGF0ZUFuZEluaXRpYWxpemVMb2NhbChzdG9yZWQ6IElBcHBTdG9yYWdlSXRlbSwgYXBwUGFja2FnZU9ySW5zdGFuY2U6IFByb3hpZWRBcHAgfCBCdWZmZXIpIHtcbiAgICAgICAgY29uc3QgYXBwID0gYXdhaXQgdGhpcy51cGRhdGVMb2NhbChzdG9yZWQsIGFwcFBhY2thZ2VPckluc3RhbmNlKTtcbiAgICAgICAgYXdhaXQgdGhpcy5pbml0aWFsaXplQXBwKHN0b3JlZCwgYXBwLCB0cnVlLCB0cnVlKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0TGFuZ3VhZ2VDb250ZW50KCk6IHsgW2tleTogc3RyaW5nXTogb2JqZWN0IH0ge1xuICAgICAgICBjb25zdCBsYW5nczogeyBba2V5OiBzdHJpbmddOiBvYmplY3QgfSA9IHt9O1xuXG4gICAgICAgIHRoaXMuYXBwcy5mb3JFYWNoKChybCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY29udGVudCA9IHJsLmdldFN0b3JhZ2VJdGVtKCkubGFuZ3VhZ2VDb250ZW50O1xuXG4gICAgICAgICAgICBPYmplY3Qua2V5cyhjb250ZW50KS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgICAgICAgICAgICBsYW5nc1trZXldID0gT2JqZWN0LmFzc2lnbihsYW5nc1trZXldIHx8IHt9LCBjb250ZW50W2tleV0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBsYW5ncztcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgY2hhbmdlU3RhdHVzKGFwcElkOiBzdHJpbmcsIHN0YXR1czogQXBwU3RhdHVzKTogUHJvbWlzZTxQcm94aWVkQXBwPiB7XG4gICAgICAgIHN3aXRjaCAoc3RhdHVzKSB7XG4gICAgICAgICAgICBjYXNlIEFwcFN0YXR1cy5NQU5VQUxMWV9ESVNBQkxFRDpcbiAgICAgICAgICAgIGNhc2UgQXBwU3RhdHVzLk1BTlVBTExZX0VOQUJMRUQ6XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBzdGF0dXMgdG8gY2hhbmdlIGFuIEFwcCB0bywgbXVzdCBiZSBtYW51YWxseSBkaXNhYmxlZCBvciBlbmFibGVkLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmwgPSB0aGlzLmFwcHMuZ2V0KGFwcElkKTtcblxuICAgICAgICBpZiAoIXJsKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NhbiBub3QgY2hhbmdlIHRoZSBzdGF0dXMgb2YgYW4gQXBwIHdoaWNoIGRvZXMgbm90IGN1cnJlbnRseSBleGlzdC4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChBcHBTdGF0dXNVdGlscy5pc0VuYWJsZWQoc3RhdHVzKSkge1xuICAgICAgICAgICAgLy8gVGhlbiBlbmFibGUgaXRcbiAgICAgICAgICAgIGlmIChBcHBTdGF0dXNVdGlscy5pc0VuYWJsZWQoYXdhaXQgcmwuZ2V0U3RhdHVzKCkpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW4gbm90IGVuYWJsZSBhbiBBcHAgd2hpY2ggaXMgYWxyZWFkeSBlbmFibGVkLicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmVuYWJsZShybC5nZXRJRCgpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICghQXBwU3RhdHVzVXRpbHMuaXNFbmFibGVkKGF3YWl0IHJsLmdldFN0YXR1cygpKSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2FuIG5vdCBkaXNhYmxlIGFuIEFwcCB3aGljaCBpcyBub3QgZW5hYmxlZC4nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXdhaXQgdGhpcy5kaXNhYmxlKHJsLmdldElEKCksIEFwcFN0YXR1cy5NQU5VQUxMWV9ESVNBQkxFRCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmw7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIHVwZGF0ZUFwcHNNYXJrZXRwbGFjZUluZm8oYXBwc092ZXJ2aWV3OiBBcnJheTx7IGxhdGVzdDogSU1hcmtldHBsYWNlSW5mbyB9Pik6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChcbiAgICAgICAgICAgIGFwcHNPdmVydmlldy5tYXAoYXN5bmMgKHsgbGF0ZXN0OiBhcHBJbmZvIH0pID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIWFwcEluZm8uc3Vic2NyaXB0aW9uSW5mbykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgYXBwID0gdGhpcy5hcHBzLmdldChhcHBJbmZvLmlkKTtcblxuICAgICAgICAgICAgICAgIGlmICghYXBwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBhcHBTdG9yYWdlSXRlbSA9IGFwcC5nZXRTdG9yYWdlSXRlbSgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbkluZm8gPSBhcHBTdG9yYWdlSXRlbS5tYXJrZXRwbGFjZUluZm8/LnN1YnNjcmlwdGlvbkluZm87XG5cbiAgICAgICAgICAgICAgICBpZiAoc3Vic2NyaXB0aW9uSW5mbyAmJiBzdWJzY3JpcHRpb25JbmZvLmxpY2Vuc2UubGljZW5zZSA9PT0gYXBwSW5mby5zdWJzY3JpcHRpb25JbmZvLmxpY2Vuc2UubGljZW5zZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgYXBwU3RvcmFnZUl0ZW0ubWFya2V0cGxhY2VJbmZvLnN1YnNjcmlwdGlvbkluZm8gPSBhcHBJbmZvLnN1YnNjcmlwdGlvbkluZm87XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5hcHBNZXRhZGF0YVN0b3JhZ2UudXBkYXRlKGFwcFN0b3JhZ2VJdGVtKTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICApLmNhdGNoKCk7XG5cbiAgICAgICAgY29uc3QgcXVldWUgPSBbXSBhcyBBcnJheTxQcm9taXNlPHZvaWQ+PjtcblxuICAgICAgICB0aGlzLmFwcHMuZm9yRWFjaCgoYXBwKSA9PlxuICAgICAgICAgICAgcXVldWUucHVzaChcbiAgICAgICAgICAgICAgICBhcHBcbiAgICAgICAgICAgICAgICAgICAgLnZhbGlkYXRlTGljZW5zZSgpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgoYXdhaXQgYXBwLmdldFN0YXR1cygpKSAhPT0gQXBwU3RhdHVzLklOVkFMSURfTElDRU5TRV9ESVNBQkxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFwcC5zZXRTdGF0dXMoQXBwU3RhdHVzLkRJU0FCTEVEKTtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgLmNhdGNoKGFzeW5jIChlcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEoZXJyb3IgaW5zdGFuY2VvZiBJbnZhbGlkTGljZW5zZUVycm9yKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wdXJnZUFwcENvbmZpZyhhcHApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXBwLnNldFN0YXR1cyhBcHBTdGF0dXMuSU5WQUxJRF9MSUNFTlNFX0RJU0FCTEVEKTtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RhdHVzID0gYXdhaXQgYXBwLmdldFN0YXR1cygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXR1cyA9PT0gYXBwLmdldFByZXZpb3VzU3RhdHVzKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHN0b3JhZ2VJdGVtID0gYXBwLmdldFN0b3JhZ2VJdGVtKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdG9yYWdlSXRlbS5zdGF0dXMgPSBzdGF0dXM7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmFwcE1ldGFkYXRhU3RvcmFnZS51cGRhdGUoc3RvcmFnZUl0ZW0pLmNhdGNoKGNvbnNvbGUuZXJyb3IpIGFzIFByb21pc2U8dm9pZD47XG4gICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgKSxcbiAgICAgICAgKTtcblxuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChxdWV1ZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR29lcyB0aHJvdWdoIHRoZSBlbnRpcmUgbG9hZGluZyB1cCBwcm9jZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGFwcElkIHRoZSBpZCBvZiB0aGUgYXBwbGljYXRpb24gdG8gbG9hZFxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBsb2FkT25lKGFwcElkOiBzdHJpbmcsIHNpbGVuY2VTdGF0dXMgPSBmYWxzZSk6IFByb21pc2U8UHJveGllZEFwcD4ge1xuICAgICAgICBjb25zdCBybCA9IHRoaXMuYXBwcy5nZXQoYXBwSWQpO1xuXG4gICAgICAgIGlmICghcmwpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gQXBwIGZvdW5kIGJ5IHRoZSBpZCBvZjogXCIke2FwcElkfVwiYCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpdGVtID0gcmwuZ2V0U3RvcmFnZUl0ZW0oKTtcblxuICAgICAgICBhd2FpdCB0aGlzLmluaXRpYWxpemVBcHAoaXRlbSwgcmwsIGZhbHNlLCBzaWxlbmNlU3RhdHVzKTtcblxuICAgICAgICBpZiAoIXRoaXMuYXJlUmVxdWlyZWRTZXR0aW5nc1NldChpdGVtKSkge1xuICAgICAgICAgICAgYXdhaXQgcmwuc2V0U3RhdHVzKEFwcFN0YXR1cy5JTlZBTElEX1NFVFRJTkdTX0RJU0FCTEVEKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghQXBwU3RhdHVzVXRpbHMuaXNEaXNhYmxlZChhd2FpdCBybC5nZXRTdGF0dXMoKSkgJiYgQXBwU3RhdHVzVXRpbHMuaXNFbmFibGVkKHJsLmdldFByZXZpb3VzU3RhdHVzKCkpKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmVuYWJsZUFwcChpdGVtLCBybCwgZmFsc2UsIHJsLmdldFByZXZpb3VzU3RhdHVzKCkgPT09IEFwcFN0YXR1cy5NQU5VQUxMWV9FTkFCTEVELCBzaWxlbmNlU3RhdHVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLmFwcHMuZ2V0KGl0ZW0uaWQpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgcnVuU3RhcnRVcFByb2Nlc3Moc3RvcmFnZUl0ZW06IElBcHBTdG9yYWdlSXRlbSwgYXBwOiBQcm94aWVkQXBwLCBpc01hbnVhbDogYm9vbGVhbiwgc2lsZW5jZVN0YXR1czogYm9vbGVhbik6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBpZiAoKGF3YWl0IGFwcC5nZXRTdGF0dXMoKSkgIT09IEFwcFN0YXR1cy5JTklUSUFMSVpFRCkge1xuICAgICAgICAgICAgY29uc3QgaXNJbml0aWFsaXplZCA9IGF3YWl0IHRoaXMuaW5pdGlhbGl6ZUFwcChzdG9yYWdlSXRlbSwgYXBwLCB0cnVlLCBzaWxlbmNlU3RhdHVzKTtcbiAgICAgICAgICAgIGlmICghaXNJbml0aWFsaXplZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5hcmVSZXF1aXJlZFNldHRpbmdzU2V0KHN0b3JhZ2VJdGVtKSkge1xuICAgICAgICAgICAgYXdhaXQgYXBwLnNldFN0YXR1cyhBcHBTdGF0dXMuSU5WQUxJRF9TRVRUSU5HU19ESVNBQkxFRCwgc2lsZW5jZVN0YXR1cyk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5lbmFibGVBcHAoc3RvcmFnZUl0ZW0sIGFwcCwgdHJ1ZSwgaXNNYW51YWwsIHNpbGVuY2VTdGF0dXMpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgaW5zdGFsbEFwcChfc3RvcmFnZUl0ZW06IElBcHBTdG9yYWdlSXRlbSwgYXBwOiBQcm94aWVkQXBwLCB1c2VyOiBJVXNlcik6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBsZXQgcmVzdWx0OiBib29sZWFuO1xuICAgICAgICBjb25zdCBjb250ZXh0ID0geyB1c2VyIH07XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IGFwcC5jYWxsKEFwcE1ldGhvZC5PTklOU1RBTEwsIGNvbnRleHQpO1xuXG4gICAgICAgICAgICByZXN1bHQgPSB0cnVlO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zdCBzdGF0dXMgPSBBcHBTdGF0dXMuRVJST1JfRElTQUJMRUQ7XG5cbiAgICAgICAgICAgIHJlc3VsdCA9IGZhbHNlO1xuXG4gICAgICAgICAgICBhd2FpdCBhcHAuc2V0U3RhdHVzKHN0YXR1cyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgdXBkYXRlQXBwKGFwcDogUHJveGllZEFwcCwgdXNlcjogSVVzZXIgfCBudWxsLCBvbGRBcHBWZXJzaW9uOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgbGV0IHJlc3VsdDogYm9vbGVhbjtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgYXBwLmNhbGwoQXBwTWV0aG9kLk9OVVBEQVRFLCB7IG9sZEFwcFZlcnNpb24sIHVzZXIgfSk7XG5cbiAgICAgICAgICAgIHJlc3VsdCA9IHRydWU7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnN0IHN0YXR1cyA9IEFwcFN0YXR1cy5FUlJPUl9ESVNBQkxFRDtcblxuICAgICAgICAgICAgcmVzdWx0ID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGF3YWl0IGFwcC5zZXRTdGF0dXMoc3RhdHVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBpbml0aWFsaXplQXBwKHN0b3JhZ2VJdGVtOiBJQXBwU3RvcmFnZUl0ZW0sIGFwcDogUHJveGllZEFwcCwgc2F2ZVRvRGIgPSB0cnVlLCBzaWxlbmNlU3RhdHVzID0gZmFsc2UpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgbGV0IHJlc3VsdDogYm9vbGVhbjtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgYXBwLnZhbGlkYXRlTGljZW5zZSgpO1xuICAgICAgICAgICAgYXdhaXQgYXBwLnZhbGlkYXRlSW5zdGFsbGF0aW9uKCk7XG5cbiAgICAgICAgICAgIGF3YWl0IGFwcC5jYWxsKEFwcE1ldGhvZC5JTklUSUFMSVpFKTtcbiAgICAgICAgICAgIGF3YWl0IGFwcC5zZXRTdGF0dXMoQXBwU3RhdHVzLklOSVRJQUxJWkVELCBzaWxlbmNlU3RhdHVzKTtcblxuICAgICAgICAgICAgcmVzdWx0ID0gdHJ1ZTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgbGV0IHN0YXR1cyA9IEFwcFN0YXR1cy5FUlJPUl9ESVNBQkxFRDtcblxuICAgICAgICAgICAgaWYgKGUgaW5zdGFuY2VvZiBJbnZhbGlkTGljZW5zZUVycm9yKSB7XG4gICAgICAgICAgICAgICAgc3RhdHVzID0gQXBwU3RhdHVzLklOVkFMSURfTElDRU5TRV9ESVNBQkxFRDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGUgaW5zdGFuY2VvZiBJbnZhbGlkSW5zdGFsbGF0aW9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgICBzdGF0dXMgPSBBcHBTdGF0dXMuSU5WQUxJRF9JTlNUQUxMQVRJT05fRElTQUJMRUQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGF3YWl0IHRoaXMucHVyZ2VBcHBDb25maWcoYXBwKTtcbiAgICAgICAgICAgIHJlc3VsdCA9IGZhbHNlO1xuXG4gICAgICAgICAgICBhd2FpdCBhcHAuc2V0U3RhdHVzKHN0YXR1cywgc2lsZW5jZVN0YXR1cyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2F2ZVRvRGIpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgYXN5bmMsIGJ1dCB3ZSBkb24ndCBjYXJlIHNpbmNlIGl0IG9ubHkgdXBkYXRlcyBpbiB0aGUgZGF0YWJhc2VcbiAgICAgICAgICAgIC8vIGFuZCBpdCBzaG91bGQgbm90IG11dGF0ZSBhbnkgcHJvcGVydGllcyB3ZSBjYXJlIGFib3V0XG4gICAgICAgICAgICBzdG9yYWdlSXRlbS5zdGF0dXMgPSBhd2FpdCBhcHAuZ2V0U3RhdHVzKCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmFwcE1ldGFkYXRhU3RvcmFnZS51cGRhdGUoc3RvcmFnZUl0ZW0pLmNhdGNoKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgcHVyZ2VBcHBDb25maWcoYXBwOiBQcm94aWVkQXBwLCBvcHRzOiBJUHVyZ2VBcHBDb25maWdPcHRzID0ge30pIHtcbiAgICAgICAgaWYgKCFvcHRzLmtlZXBTY2hlZHVsZWRKb2JzKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnNjaGVkdWxlck1hbmFnZXIuY2xlYW5VcChhcHAuZ2V0SUQoKSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5saXN0ZW5lck1hbmFnZXIudW5yZWdpc3Rlckxpc3RlbmVycyhhcHApO1xuICAgICAgICB0aGlzLmxpc3RlbmVyTWFuYWdlci5sb2NrRXNzZW50aWFsRXZlbnRzKGFwcCk7XG4gICAgICAgIGF3YWl0IHRoaXMuY29tbWFuZE1hbmFnZXIudW5yZWdpc3RlckNvbW1hbmRzKGFwcC5nZXRJRCgpKTtcbiAgICAgICAgdGhpcy5leHRlcm5hbENvbXBvbmVudE1hbmFnZXIudW5yZWdpc3RlckV4dGVybmFsQ29tcG9uZW50cyhhcHAuZ2V0SUQoKSk7XG4gICAgICAgIGF3YWl0IHRoaXMuYXBpTWFuYWdlci51bnJlZ2lzdGVyQXBpcyhhcHAuZ2V0SUQoKSk7XG4gICAgICAgIHRoaXMuYWNjZXNzb3JNYW5hZ2VyLnB1cmlmeUFwcChhcHAuZ2V0SUQoKSk7XG4gICAgICAgIHRoaXMudWlBY3Rpb25CdXR0b25NYW5hZ2VyLmNsZWFyQXBwQWN0aW9uQnV0dG9ucyhhcHAuZ2V0SUQoKSk7XG4gICAgICAgIHRoaXMudmlkZW9Db25mUHJvdmlkZXJNYW5hZ2VyLnVucmVnaXN0ZXJQcm92aWRlcnMoYXBwLmdldElEKCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERldGVybWluZXMgaWYgdGhlIEFwcCdzIHJlcXVpcmVkIHNldHRpbmdzIGFyZSBzZXQgb3Igbm90LlxuICAgICAqIFNob3VsZCBhIHBhY2thZ2VWYWx1ZSBiZSBwcm92aWRlZCBhbmQgbm90IGVtcHR5LCB0aGVuIGl0J3MgY29uc2lkZXJlZCBzZXQuXG4gICAgICovXG4gICAgcHJpdmF0ZSBhcmVSZXF1aXJlZFNldHRpbmdzU2V0KHN0b3JhZ2VJdGVtOiBJQXBwU3RvcmFnZUl0ZW0pOiBib29sZWFuIHtcbiAgICAgICAgbGV0IHJlc3VsdCA9IHRydWU7XG5cbiAgICAgICAgZm9yIChjb25zdCBzZXRrIG9mIE9iamVjdC5rZXlzKHN0b3JhZ2VJdGVtLnNldHRpbmdzKSkge1xuICAgICAgICAgICAgY29uc3Qgc2V0dCA9IHN0b3JhZ2VJdGVtLnNldHRpbmdzW3NldGtdO1xuICAgICAgICAgICAgLy8gSWYgaXQncyBub3QgcmVxdWlyZWQsIGlnbm9yZVxuICAgICAgICAgICAgaWYgKCFzZXR0LnJlcXVpcmVkKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzZXR0LnZhbHVlICE9PSAndW5kZWZpbmVkJyB8fCBzZXR0LnBhY2thZ2VWYWx1ZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVzdWx0ID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgZW5hYmxlQXBwKHN0b3JhZ2VJdGVtOiBJQXBwU3RvcmFnZUl0ZW0sIGFwcDogUHJveGllZEFwcCwgc2F2ZVRvRGIgPSB0cnVlLCBpc01hbnVhbDogYm9vbGVhbiwgc2lsZW5jZVN0YXR1cyA9IGZhbHNlKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIGxldCBlbmFibGU6IGJvb2xlYW47XG4gICAgICAgIGxldCBzdGF0dXMgPSBBcHBTdGF0dXMuRVJST1JfRElTQUJMRUQ7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IGFwcC52YWxpZGF0ZUxpY2Vuc2UoKTtcbiAgICAgICAgICAgIGF3YWl0IGFwcC52YWxpZGF0ZUluc3RhbGxhdGlvbigpO1xuXG4gICAgICAgICAgICBlbmFibGUgPSAoYXdhaXQgYXBwLmNhbGwoQXBwTWV0aG9kLk9ORU5BQkxFKSkgYXMgYm9vbGVhbjtcblxuICAgICAgICAgICAgaWYgKGVuYWJsZSkge1xuICAgICAgICAgICAgICAgIHN0YXR1cyA9IGlzTWFudWFsID8gQXBwU3RhdHVzLk1BTlVBTExZX0VOQUJMRUQgOiBBcHBTdGF0dXMuQVVUT19FTkFCTEVEO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzdGF0dXMgPSBBcHBTdGF0dXMuRElTQUJMRUQ7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBUaGUgQXBwICgke2FwcC5nZXRJRCgpfSkgZGlzYWJsZWQgaXRzZWxmIHdoZW4gYmVpbmcgZW5hYmxlZC4gXFxuQ2hlY2sgdGhlIFwib25FbmFibGVcIiBpbXBsZW1lbnRhdGlvbiBmb3IgZGV0YWlscy5gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgZW5hYmxlID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGlmIChlIGluc3RhbmNlb2YgSW52YWxpZExpY2Vuc2VFcnJvcikge1xuICAgICAgICAgICAgICAgIHN0YXR1cyA9IEFwcFN0YXR1cy5JTlZBTElEX0xJQ0VOU0VfRElTQUJMRUQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChlIGluc3RhbmNlb2YgSW52YWxpZEluc3RhbGxhdGlvbkVycm9yKSB7XG4gICAgICAgICAgICAgICAgc3RhdHVzID0gQXBwU3RhdHVzLklOVkFMSURfSU5TVEFMTEFUSU9OX0RJU0FCTEVEO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGVuYWJsZSkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5jb21tYW5kTWFuYWdlci5yZWdpc3RlckNvbW1hbmRzKGFwcC5nZXRJRCgpKTtcbiAgICAgICAgICAgIHRoaXMuZXh0ZXJuYWxDb21wb25lbnRNYW5hZ2VyLnJlZ2lzdGVyRXh0ZXJuYWxDb21wb25lbnRzKGFwcC5nZXRJRCgpKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuYXBpTWFuYWdlci5yZWdpc3RlckFwaXMoYXBwLmdldElEKCkpO1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5lck1hbmFnZXIucmVnaXN0ZXJMaXN0ZW5lcnMoYXBwKTtcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXJNYW5hZ2VyLnJlbGVhc2VFc3NlbnRpYWxFdmVudHMoYXBwKTtcbiAgICAgICAgICAgIHRoaXMudmlkZW9Db25mUHJvdmlkZXJNYW5hZ2VyLnJlZ2lzdGVyUHJvdmlkZXJzKGFwcC5nZXRJRCgpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucHVyZ2VBcHBDb25maWcoYXBwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzYXZlVG9EYikge1xuICAgICAgICAgICAgc3RvcmFnZUl0ZW0uc3RhdHVzID0gc3RhdHVzO1xuICAgICAgICAgICAgLy8gVGhpcyBpcyBhc3luYywgYnV0IHdlIGRvbid0IGNhcmUgc2luY2UgaXQgb25seSB1cGRhdGVzIGluIHRoZSBkYXRhYmFzZVxuICAgICAgICAgICAgLy8gYW5kIGl0IHNob3VsZCBub3QgbXV0YXRlIGFueSBwcm9wZXJ0aWVzIHdlIGNhcmUgYWJvdXRcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuYXBwTWV0YWRhdGFTdG9yYWdlLnVwZGF0ZShzdG9yYWdlSXRlbSkuY2F0Y2goKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IGFwcC5zZXRTdGF0dXMoc3RhdHVzLCBzaWxlbmNlU3RhdHVzKTtcblxuICAgICAgICByZXR1cm4gZW5hYmxlO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgY3JlYXRlQXBwVXNlcihhcHBJbmZvOiBJQXBwSW5mbyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgICAgIGNvbnN0IGFwcFVzZXIgPSBhd2FpdCAodGhpcy5icmlkZ2VzLmdldFVzZXJCcmlkZ2UoKSBhcyBJSW50ZXJuYWxVc2VyQnJpZGdlICYgVXNlckJyaWRnZSkuZ2V0QXBwVXNlcihhcHBJbmZvLmlkKTtcblxuICAgICAgICBpZiAoYXBwVXNlcikge1xuICAgICAgICAgICAgcmV0dXJuIGFwcFVzZXIuaWQ7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB1c2VyRGF0YTogUGFydGlhbDxJVXNlcj4gPSB7XG4gICAgICAgICAgICB1c2VybmFtZTogYCR7YXBwSW5mby5uYW1lU2x1Z30uYm90YCxcbiAgICAgICAgICAgIG5hbWU6IGFwcEluZm8ubmFtZSxcbiAgICAgICAgICAgIHJvbGVzOiBbJ2FwcCddLFxuICAgICAgICAgICAgYXBwSWQ6IGFwcEluZm8uaWQsXG4gICAgICAgICAgICB0eXBlOiBVc2VyVHlwZS5BUFAsXG4gICAgICAgICAgICBzdGF0dXM6ICdvbmxpbmUnLFxuICAgICAgICAgICAgaXNFbmFibGVkOiB0cnVlLFxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiAodGhpcy5icmlkZ2VzLmdldFVzZXJCcmlkZ2UoKSBhcyBJSW50ZXJuYWxVc2VyQnJpZGdlICYgVXNlckJyaWRnZSkuY3JlYXRlKHVzZXJEYXRhLCBhcHBJbmZvLmlkLCB7XG4gICAgICAgICAgICBhdmF0YXJVcmw6IGFwcEluZm8uaWNvbkZpbGVDb250ZW50IHx8IGFwcEluZm8uaWNvbkZpbGUsXG4gICAgICAgICAgICBqb2luRGVmYXVsdENoYW5uZWxzOiB0cnVlLFxuICAgICAgICAgICAgc2VuZFdlbGNvbWVFbWFpbDogZmFsc2UsXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgcmVtb3ZlQXBwVXNlcihhcHA6IFByb3hpZWRBcHApOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgY29uc3QgYXBwVXNlciA9IGF3YWl0ICh0aGlzLmJyaWRnZXMuZ2V0VXNlckJyaWRnZSgpIGFzIElJbnRlcm5hbFVzZXJCcmlkZ2UgJiBVc2VyQnJpZGdlKS5nZXRBcHBVc2VyKGFwcC5nZXRJRCgpKTtcblxuICAgICAgICBpZiAoIWFwcFVzZXIpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuICh0aGlzLmJyaWRnZXMuZ2V0VXNlckJyaWRnZSgpIGFzIElJbnRlcm5hbFVzZXJCcmlkZ2UgJiBVc2VyQnJpZGdlKS5yZW1vdmUoYXBwVXNlciwgYXBwLmdldElEKCkpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgdW5pbnN0YWxsQXBwKGFwcDogUHJveGllZEFwcCwgdXNlcjogSVVzZXIpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgbGV0IHJlc3VsdDogYm9vbGVhbjtcbiAgICAgICAgY29uc3QgY29udGV4dCA9IHsgdXNlciB9O1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCBhcHAuY2FsbChBcHBNZXRob2QuT05VTklOU1RBTEwsIGNvbnRleHQpO1xuXG4gICAgICAgICAgICByZXN1bHQgPSB0cnVlO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zdCBzdGF0dXMgPSBBcHBTdGF0dXMuRVJST1JfRElTQUJMRUQ7XG5cbiAgICAgICAgICAgIHJlc3VsdCA9IGZhbHNlO1xuXG4gICAgICAgICAgICBhd2FpdCBhcHAuc2V0U3RhdHVzKHN0YXR1cyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IGdldFBlcm1pc3Npb25zQnlBcHBJZCA9IChhcHBJZDogc3RyaW5nKSA9PiB7XG4gICAgaWYgKCFBcHBNYW5hZ2VyLkluc3RhbmNlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0FwcE1hbmFnZXIgc2hvdWxkIGJlIGluc3RhbnRpYXRlZCBmaXJzdCcpO1xuICAgICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIHJldHVybiBBcHBNYW5hZ2VyLkluc3RhbmNlLmdldFBlcm1pc3Npb25zQnlJZChhcHBJZCk7XG59O1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsTUFBTSxRQUFRLFNBQVM7QUFHaEMsU0FBUyxVQUFVLFFBQVEsZUFBZTtBQUUxQyxTQUFTLFVBQVUsUUFBUSxZQUFZO0FBQ3ZDLFNBQVMsU0FBUyxFQUFFLGNBQWMsUUFBUSwwQkFBMEI7QUFFcEUsU0FBUyxTQUFTLFFBQVEseUJBQXlCO0FBR25ELFNBQVMsUUFBUSxRQUFRLHNCQUFzQjtBQUcvQyxTQUFTLFdBQVcsRUFBRSx5QkFBeUIsRUFBRSxnQkFBZ0IsUUFBUSxhQUFhO0FBQ3RGLFNBQVMsbUJBQW1CLFFBQVEsV0FBVztBQUMvQyxTQUFTLHdCQUF3QixRQUFRLG9DQUFvQztBQUM3RSxTQUNJLGtCQUFrQixFQUNsQixhQUFhLEVBQ2IsMkJBQTJCLEVBQzNCLGlCQUFpQixFQUNqQixrQkFBa0IsRUFDbEIsbUJBQW1CLEVBQ25CLGtCQUFrQixFQUNsQixzQkFBc0IsRUFDdEIsMkJBQTJCLFFBQ3hCLGFBQWE7QUFDcEIsU0FBUyxpQkFBaUIsUUFBUSwrQkFBK0I7QUFDakUsU0FBUyxtQkFBbUIsUUFBUSxpQ0FBaUM7QUFDckUsU0FBUyxxQkFBcUIsUUFBUSxtQ0FBbUM7QUFFekUsU0FBUyxrQkFBa0IsUUFBUSwrQkFBK0I7QUFHbEUsU0FBUyxhQUFhLEVBQUUsa0JBQWtCLFFBQVEsWUFBWTtBQUM5RCxTQUFTLGdCQUFnQixRQUFRLDZCQUE2QjtBQUM5RCxTQUFTLHFCQUFxQixRQUFRLDRCQUE0QjtBQXdCbEUsT0FBTyxNQUFNO0VBQ1QsT0FBYyxTQUFxQjtFQUVuQyxnQ0FBZ0M7RUFDZixLQUE4QjtFQUU5QixtQkFBdUM7RUFFaEQsaUJBQW1DO0VBRTFCLFdBQTBCO0VBRTFCLFFB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