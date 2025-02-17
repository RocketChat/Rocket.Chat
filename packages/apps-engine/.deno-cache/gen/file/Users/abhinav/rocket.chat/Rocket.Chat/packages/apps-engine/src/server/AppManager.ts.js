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
            return Promise.resolve(AppStatus.COMPILER_ERROR_DISABLED);
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
      if (appPackageOrInstance instanceof ProxiedApp) {
        return appPackageOrInstance;
      }
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
      const { subscriptionInfo } = appStorageItem.marketplaceInfo?.[0] || {};
      if (subscriptionInfo && subscriptionInfo.license.license === appInfo.subscriptionInfo.license.license) {
        return;
      }
      appStorageItem.marketplaceInfo[0].subscriptionInfo = appInfo.subscriptionInfo;
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
      // If some error has happened in initialization, like license or installations invalidation
      // we need to store this on the DB regardless of what the parameter requests
      saveToDb = true;
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
      // If some error has happened during enabling, like license or installations invalidation
      // we need to store this on the DB regardless of what the parameter requests
      saveToDb = true;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvYWJoaW5hdi9yb2NrZXQuY2hhdC9Sb2NrZXQuQ2hhdC9wYWNrYWdlcy9hcHBzLWVuZ2luZS9zcmMvc2VydmVyL0FwcE1hbmFnZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSAnYnVmZmVyJztcblxuaW1wb3J0IHR5cGUgeyBJR2V0QXBwc0ZpbHRlciB9IGZyb20gJy4vSUdldEFwcHNGaWx0ZXInO1xuaW1wb3J0IHsgUHJveGllZEFwcCB9IGZyb20gJy4vUHJveGllZEFwcCc7XG5pbXBvcnQgdHlwZSB7IFBlcnNpc3RlbmNlQnJpZGdlLCBVc2VyQnJpZGdlIH0gZnJvbSAnLi9icmlkZ2VzJztcbmltcG9ydCB7IEFwcEJyaWRnZXMgfSBmcm9tICcuL2JyaWRnZXMnO1xuaW1wb3J0IHsgQXBwU3RhdHVzLCBBcHBTdGF0dXNVdGlscyB9IGZyb20gJy4uL2RlZmluaXRpb24vQXBwU3RhdHVzJztcbmltcG9ydCB0eXBlIHsgSUFwcEluZm8gfSBmcm9tICcuLi9kZWZpbml0aW9uL21ldGFkYXRhJztcbmltcG9ydCB7IEFwcE1ldGhvZCB9IGZyb20gJy4uL2RlZmluaXRpb24vbWV0YWRhdGEnO1xuaW1wb3J0IHR5cGUgeyBJUGVybWlzc2lvbiB9IGZyb20gJy4uL2RlZmluaXRpb24vcGVybWlzc2lvbnMvSVBlcm1pc3Npb24nO1xuaW1wb3J0IHR5cGUgeyBJVXNlciB9IGZyb20gJy4uL2RlZmluaXRpb24vdXNlcnMnO1xuaW1wb3J0IHsgVXNlclR5cGUgfSBmcm9tICcuLi9kZWZpbml0aW9uL3VzZXJzJztcbmltcG9ydCB0eXBlIHsgSUludGVybmFsUGVyc2lzdGVuY2VCcmlkZ2UgfSBmcm9tICcuL2JyaWRnZXMvSUludGVybmFsUGVyc2lzdGVuY2VCcmlkZ2UnO1xuaW1wb3J0IHR5cGUgeyBJSW50ZXJuYWxVc2VyQnJpZGdlIH0gZnJvbSAnLi9icmlkZ2VzL0lJbnRlcm5hbFVzZXJCcmlkZ2UnO1xuaW1wb3J0IHsgQXBwQ29tcGlsZXIsIEFwcEZhYnJpY2F0aW9uRnVsZmlsbG1lbnQsIEFwcFBhY2thZ2VQYXJzZXIgfSBmcm9tICcuL2NvbXBpbGVyJztcbmltcG9ydCB7IEludmFsaWRMaWNlbnNlRXJyb3IgfSBmcm9tICcuL2Vycm9ycyc7XG5pbXBvcnQgeyBJbnZhbGlkSW5zdGFsbGF0aW9uRXJyb3IgfSBmcm9tICcuL2Vycm9ycy9JbnZhbGlkSW5zdGFsbGF0aW9uRXJyb3InO1xuaW1wb3J0IHtcbiAgICBBcHBBY2Nlc3Nvck1hbmFnZXIsXG4gICAgQXBwQXBpTWFuYWdlcixcbiAgICBBcHBFeHRlcm5hbENvbXBvbmVudE1hbmFnZXIsXG4gICAgQXBwTGljZW5zZU1hbmFnZXIsXG4gICAgQXBwTGlzdGVuZXJNYW5hZ2VyLFxuICAgIEFwcFNjaGVkdWxlck1hbmFnZXIsXG4gICAgQXBwU2V0dGluZ3NNYW5hZ2VyLFxuICAgIEFwcFNsYXNoQ29tbWFuZE1hbmFnZXIsXG4gICAgQXBwVmlkZW9Db25mUHJvdmlkZXJNYW5hZ2VyLFxufSBmcm9tICcuL21hbmFnZXJzJztcbmltcG9ydCB7IEFwcFJ1bnRpbWVNYW5hZ2VyIH0gZnJvbSAnLi9tYW5hZ2Vycy9BcHBSdW50aW1lTWFuYWdlcic7XG5pbXBvcnQgeyBBcHBTaWduYXR1cmVNYW5hZ2VyIH0gZnJvbSAnLi9tYW5hZ2Vycy9BcHBTaWduYXR1cmVNYW5hZ2VyJztcbmltcG9ydCB7IFVJQWN0aW9uQnV0dG9uTWFuYWdlciB9IGZyb20gJy4vbWFuYWdlcnMvVUlBY3Rpb25CdXR0b25NYW5hZ2VyJztcbmltcG9ydCB0eXBlIHsgSU1hcmtldHBsYWNlSW5mbyB9IGZyb20gJy4vbWFya2V0cGxhY2UnO1xuaW1wb3J0IHsgZGVmYXVsdFBlcm1pc3Npb25zIH0gZnJvbSAnLi9wZXJtaXNzaW9ucy9BcHBQZXJtaXNzaW9ucyc7XG5pbXBvcnQgdHlwZSB7IERlbm9SdW50aW1lU3VicHJvY2Vzc0NvbnRyb2xsZXIgfSBmcm9tICcuL3J1bnRpbWUvZGVuby9BcHBzRW5naW5lRGVub1J1bnRpbWUnO1xuaW1wb3J0IHR5cGUgeyBJQXBwU3RvcmFnZUl0ZW0gfSBmcm9tICcuL3N0b3JhZ2UnO1xuaW1wb3J0IHsgQXBwTG9nU3RvcmFnZSwgQXBwTWV0YWRhdGFTdG9yYWdlIH0gZnJvbSAnLi9zdG9yYWdlJztcbmltcG9ydCB7IEFwcFNvdXJjZVN0b3JhZ2UgfSBmcm9tICcuL3N0b3JhZ2UvQXBwU291cmNlU3RvcmFnZSc7XG5pbXBvcnQgeyBBcHBJbnN0YWxsYXRpb25Tb3VyY2UgfSBmcm9tICcuL3N0b3JhZ2UvSUFwcFN0b3JhZ2VJdGVtJztcblxuZXhwb3J0IGludGVyZmFjZSBJQXBwSW5zdGFsbFBhcmFtZXRlcnMge1xuICAgIGVuYWJsZTogYm9vbGVhbjtcbiAgICBtYXJrZXRwbGFjZUluZm8/OiBJTWFya2V0cGxhY2VJbmZvW107XG4gICAgcGVybWlzc2lvbnNHcmFudGVkPzogQXJyYXk8SVBlcm1pc3Npb24+O1xuICAgIHVzZXI6IElVc2VyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElBcHBVbmluc3RhbGxQYXJhbWV0ZXJzIHtcbiAgICB1c2VyOiBJVXNlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJQXBwTWFuYWdlckRlcHMge1xuICAgIG1ldGFkYXRhU3RvcmFnZTogQXBwTWV0YWRhdGFTdG9yYWdlO1xuICAgIGxvZ1N0b3JhZ2U6IEFwcExvZ1N0b3JhZ2U7XG4gICAgYnJpZGdlczogQXBwQnJpZGdlcztcbiAgICBzb3VyY2VTdG9yYWdlOiBBcHBTb3VyY2VTdG9yYWdlO1xufVxuXG5pbnRlcmZhY2UgSVB1cmdlQXBwQ29uZmlnT3B0cyB7XG4gICAga2VlcFNjaGVkdWxlZEpvYnM/OiBib29sZWFuO1xufVxuXG5leHBvcnQgY2xhc3MgQXBwTWFuYWdlciB7XG4gICAgcHVibGljIHN0YXRpYyBJbnN0YW5jZTogQXBwTWFuYWdlcjtcblxuICAgIC8vIGFwcHMgY29udGFpbnMgYWxsIG9mIHRoZSBBcHBzXG4gICAgcHJpdmF0ZSByZWFkb25seSBhcHBzOiBNYXA8c3RyaW5nLCBQcm94aWVkQXBwPjtcblxuICAgIHByaXZhdGUgcmVhZG9ubHkgYXBwTWV0YWRhdGFTdG9yYWdlOiBBcHBNZXRhZGF0YVN0b3JhZ2U7XG5cbiAgICBwcml2YXRlIGFwcFNvdXJjZVN0b3JhZ2U6IEFwcFNvdXJjZVN0b3JhZ2U7XG5cbiAgICBwcml2YXRlIHJlYWRvbmx5IGxvZ1N0b3JhZ2U6IEFwcExvZ1N0b3JhZ2U7XG5cbiAgICBwcml2YXRlIHJlYWRvbmx5IGJyaWRnZXM6IEFwcEJyaWRnZXM7XG5cbiAgICBwcml2YXRlIHJlYWRvbmx5IHBhcnNlcjogQXBwUGFja2FnZVBhcnNlcjtcblxuICAgIHByaXZhdGUgcmVhZG9ubHkgY29tcGlsZXI6IEFwcENvbXBpbGVyO1xuXG4gICAgcHJpdmF0ZSByZWFkb25seSBhY2Nlc3Nvck1hbmFnZXI6IEFwcEFjY2Vzc29yTWFuYWdlcjtcblxuICAgIHByaXZhdGUgcmVhZG9ubHkgbGlzdGVuZXJNYW5hZ2VyOiBBcHBMaXN0ZW5lck1hbmFnZXI7XG5cbiAgICBwcml2YXRlIHJlYWRvbmx5IGNvbW1hbmRNYW5hZ2VyOiBBcHBTbGFzaENvbW1hbmRNYW5hZ2VyO1xuXG4gICAgcHJpdmF0ZSByZWFkb25seSBhcGlNYW5hZ2VyOiBBcHBBcGlNYW5hZ2VyO1xuXG4gICAgcHJpdmF0ZSByZWFkb25seSBleHRlcm5hbENvbXBvbmVudE1hbmFnZXI6IEFwcEV4dGVybmFsQ29tcG9uZW50TWFuYWdlcjtcblxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NNYW5hZ2VyOiBBcHBTZXR0aW5nc01hbmFnZXI7XG5cbiAgICBwcml2YXRlIHJlYWRvbmx5IGxpY2Vuc2VNYW5hZ2VyOiBBcHBMaWNlbnNlTWFuYWdlcjtcblxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2NoZWR1bGVyTWFuYWdlcjogQXBwU2NoZWR1bGVyTWFuYWdlcjtcblxuICAgIHByaXZhdGUgcmVhZG9ubHkgdWlBY3Rpb25CdXR0b25NYW5hZ2VyOiBVSUFjdGlvbkJ1dHRvbk1hbmFnZXI7XG5cbiAgICBwcml2YXRlIHJlYWRvbmx5IHZpZGVvQ29uZlByb3ZpZGVyTWFuYWdlcjogQXBwVmlkZW9Db25mUHJvdmlkZXJNYW5hZ2VyO1xuXG4gICAgcHJpdmF0ZSByZWFkb25seSBzaWduYXR1cmVNYW5hZ2VyOiBBcHBTaWduYXR1cmVNYW5hZ2VyO1xuXG4gICAgcHJpdmF0ZSByZWFkb25seSBydW50aW1lOiBBcHBSdW50aW1lTWFuYWdlcjtcblxuICAgIHByaXZhdGUgaXNMb2FkZWQ6IGJvb2xlYW47XG5cbiAgICBjb25zdHJ1Y3Rvcih7IG1ldGFkYXRhU3RvcmFnZSwgbG9nU3RvcmFnZSwgYnJpZGdlcywgc291cmNlU3RvcmFnZSB9OiBJQXBwTWFuYWdlckRlcHMpIHtcbiAgICAgICAgLy8gU2luZ2xldG9uIHN0eWxlLiBUaGVyZSBjYW4gb25seSBldmVyIGJlIG9uZSBBcHBNYW5hZ2VyIGluc3RhbmNlXG4gICAgICAgIGlmICh0eXBlb2YgQXBwTWFuYWdlci5JbnN0YW5jZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlcmUgaXMgYWxyZWFkeSBhIHZhbGlkIEFwcE1hbmFnZXIgaW5zdGFuY2UnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChtZXRhZGF0YVN0b3JhZ2UgaW5zdGFuY2VvZiBBcHBNZXRhZGF0YVN0b3JhZ2UpIHtcbiAgICAgICAgICAgIHRoaXMuYXBwTWV0YWRhdGFTdG9yYWdlID0gbWV0YWRhdGFTdG9yYWdlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGluc3RhbmNlIG9mIHRoZSBBcHBNZXRhZGF0YVN0b3JhZ2UnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChsb2dTdG9yYWdlIGluc3RhbmNlb2YgQXBwTG9nU3RvcmFnZSkge1xuICAgICAgICAgICAgdGhpcy5sb2dTdG9yYWdlID0gbG9nU3RvcmFnZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBpbnN0YW5jZSBvZiB0aGUgQXBwTG9nU3RvcmFnZScpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGJyaWRnZXMgaW5zdGFuY2VvZiBBcHBCcmlkZ2VzKSB7XG4gICAgICAgICAgICB0aGlzLmJyaWRnZXMgPSBicmlkZ2VzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGluc3RhbmNlIG9mIHRoZSBBcHBCcmlkZ2VzJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc291cmNlU3RvcmFnZSBpbnN0YW5jZW9mIEFwcFNvdXJjZVN0b3JhZ2UpIHtcbiAgICAgICAgICAgIHRoaXMuYXBwU291cmNlU3RvcmFnZSA9IHNvdXJjZVN0b3JhZ2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgaW5zdGFuY2Ugb2YgdGhlIEFwcFNvdXJjZVN0b3JhZ2UnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuYXBwcyA9IG5ldyBNYXA8c3RyaW5nLCBQcm94aWVkQXBwPigpO1xuXG4gICAgICAgIHRoaXMucGFyc2VyID0gbmV3IEFwcFBhY2thZ2VQYXJzZXIoKTtcbiAgICAgICAgdGhpcy5jb21waWxlciA9IG5ldyBBcHBDb21waWxlcigpO1xuICAgICAgICB0aGlzLmFjY2Vzc29yTWFuYWdlciA9IG5ldyBBcHBBY2Nlc3Nvck1hbmFnZXIodGhpcyk7XG4gICAgICAgIHRoaXMubGlzdGVuZXJNYW5hZ2VyID0gbmV3IEFwcExpc3RlbmVyTWFuYWdlcih0aGlzKTtcbiAgICAgICAgdGhpcy5jb21tYW5kTWFuYWdlciA9IG5ldyBBcHBTbGFzaENvbW1hbmRNYW5hZ2VyKHRoaXMpO1xuICAgICAgICB0aGlzLmFwaU1hbmFnZXIgPSBuZXcgQXBwQXBpTWFuYWdlcih0aGlzKTtcbiAgICAgICAgdGhpcy5leHRlcm5hbENvbXBvbmVudE1hbmFnZXIgPSBuZXcgQXBwRXh0ZXJuYWxDb21wb25lbnRNYW5hZ2VyKCk7XG4gICAgICAgIHRoaXMuc2V0dGluZ3NNYW5hZ2VyID0gbmV3IEFwcFNldHRpbmdzTWFuYWdlcih0aGlzKTtcbiAgICAgICAgdGhpcy5saWNlbnNlTWFuYWdlciA9IG5ldyBBcHBMaWNlbnNlTWFuYWdlcih0aGlzKTtcbiAgICAgICAgdGhpcy5zY2hlZHVsZXJNYW5hZ2VyID0gbmV3IEFwcFNjaGVkdWxlck1hbmFnZXIodGhpcyk7XG4gICAgICAgIHRoaXMudWlBY3Rpb25CdXR0b25NYW5hZ2VyID0gbmV3IFVJQWN0aW9uQnV0dG9uTWFuYWdlcih0aGlzKTtcbiAgICAgICAgdGhpcy52aWRlb0NvbmZQcm92aWRlck1hbmFnZXIgPSBuZXcgQXBwVmlkZW9Db25mUHJvdmlkZXJNYW5hZ2VyKHRoaXMpO1xuICAgICAgICB0aGlzLnNpZ25hdHVyZU1hbmFnZXIgPSBuZXcgQXBwU2lnbmF0dXJlTWFuYWdlcih0aGlzKTtcbiAgICAgICAgdGhpcy5ydW50aW1lID0gbmV3IEFwcFJ1bnRpbWVNYW5hZ2VyKHRoaXMpO1xuXG4gICAgICAgIHRoaXMuaXNMb2FkZWQgPSBmYWxzZTtcbiAgICAgICAgQXBwTWFuYWdlci5JbnN0YW5jZSA9IHRoaXM7XG4gICAgfVxuXG4gICAgLyoqIEdldHMgdGhlIGluc3RhbmNlIG9mIHRoZSBzdG9yYWdlIGNvbm5lY3Rvci4gKi9cbiAgICBwdWJsaWMgZ2V0U3RvcmFnZSgpOiBBcHBNZXRhZGF0YVN0b3JhZ2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5hcHBNZXRhZGF0YVN0b3JhZ2U7XG4gICAgfVxuXG4gICAgLyoqIEdldHMgdGhlIGluc3RhbmNlIG9mIHRoZSBsb2cgc3RvcmFnZSBjb25uZWN0b3IuICovXG4gICAgcHVibGljIGdldExvZ1N0b3JhZ2UoKTogQXBwTG9nU3RvcmFnZSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxvZ1N0b3JhZ2U7XG4gICAgfVxuXG4gICAgLyoqIEdldHMgdGhlIGluc3RhbmNlIG9mIHRoZSBBcHAgcGFja2FnZSBwYXJzZXIuICovXG4gICAgcHVibGljIGdldFBhcnNlcigpOiBBcHBQYWNrYWdlUGFyc2VyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VyO1xuICAgIH1cblxuICAgIC8qKiBHZXRzIHRoZSBjb21waWxlciBpbnN0YW5jZS4gKi9cbiAgICBwdWJsaWMgZ2V0Q29tcGlsZXIoKTogQXBwQ29tcGlsZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5jb21waWxlcjtcbiAgICB9XG5cbiAgICAvKiogR2V0cyB0aGUgYWNjZXNzb3IgbWFuYWdlciBpbnN0YW5jZS4gKi9cbiAgICBwdWJsaWMgZ2V0QWNjZXNzb3JNYW5hZ2VyKCk6IEFwcEFjY2Vzc29yTWFuYWdlciB7XG4gICAgICAgIHJldHVybiB0aGlzLmFjY2Vzc29yTWFuYWdlcjtcbiAgICB9XG5cbiAgICAvKiogR2V0cyB0aGUgaW5zdGFuY2Ugb2YgdGhlIEJyaWRnZSBtYW5hZ2VyLiAqL1xuICAgIHB1YmxpYyBnZXRCcmlkZ2VzKCk6IEFwcEJyaWRnZXMge1xuICAgICAgICByZXR1cm4gdGhpcy5icmlkZ2VzO1xuICAgIH1cblxuICAgIC8qKiBHZXRzIHRoZSBpbnN0YW5jZSBvZiB0aGUgbGlzdGVuZXIgbWFuYWdlci4gKi9cbiAgICBwdWJsaWMgZ2V0TGlzdGVuZXJNYW5hZ2VyKCk6IEFwcExpc3RlbmVyTWFuYWdlciB7XG4gICAgICAgIHJldHVybiB0aGlzLmxpc3RlbmVyTWFuYWdlcjtcbiAgICB9XG5cbiAgICAvKiogR2V0cyB0aGUgY29tbWFuZCBtYW5hZ2VyJ3MgaW5zdGFuY2UuICovXG4gICAgcHVibGljIGdldENvbW1hbmRNYW5hZ2VyKCk6IEFwcFNsYXNoQ29tbWFuZE1hbmFnZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5jb21tYW5kTWFuYWdlcjtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0VmlkZW9Db25mUHJvdmlkZXJNYW5hZ2VyKCk6IEFwcFZpZGVvQ29uZlByb3ZpZGVyTWFuYWdlciB7XG4gICAgICAgIHJldHVybiB0aGlzLnZpZGVvQ29uZlByb3ZpZGVyTWFuYWdlcjtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0TGljZW5zZU1hbmFnZXIoKTogQXBwTGljZW5zZU1hbmFnZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5saWNlbnNlTWFuYWdlcjtcbiAgICB9XG5cbiAgICAvKiogR2V0cyB0aGUgYXBpIG1hbmFnZXIncyBpbnN0YW5jZS4gKi9cbiAgICBwdWJsaWMgZ2V0QXBpTWFuYWdlcigpOiBBcHBBcGlNYW5hZ2VyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpTWFuYWdlcjtcbiAgICB9XG5cbiAgICAvKiogR2V0cyB0aGUgZXh0ZXJuYWwgY29tcG9uZW50IG1hbmFnZXIncyBpbnN0YW5jZS4gKi9cbiAgICBwdWJsaWMgZ2V0RXh0ZXJuYWxDb21wb25lbnRNYW5hZ2VyKCk6IEFwcEV4dGVybmFsQ29tcG9uZW50TWFuYWdlciB7XG4gICAgICAgIHJldHVybiB0aGlzLmV4dGVybmFsQ29tcG9uZW50TWFuYWdlcjtcbiAgICB9XG5cbiAgICAvKiogR2V0cyB0aGUgbWFuYWdlciBvZiB0aGUgc2V0dGluZ3MsIHVwZGF0ZXMgYW5kIGdldHRpbmcuICovXG4gICAgcHVibGljIGdldFNldHRpbmdzTWFuYWdlcigpOiBBcHBTZXR0aW5nc01hbmFnZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5zZXR0aW5nc01hbmFnZXI7XG4gICAgfVxuXG4gICAgcHVibGljIGdldFNjaGVkdWxlck1hbmFnZXIoKTogQXBwU2NoZWR1bGVyTWFuYWdlciB7XG4gICAgICAgIHJldHVybiB0aGlzLnNjaGVkdWxlck1hbmFnZXI7XG4gICAgfVxuXG4gICAgcHVibGljIGdldFVJQWN0aW9uQnV0dG9uTWFuYWdlcigpOiBVSUFjdGlvbkJ1dHRvbk1hbmFnZXIge1xuICAgICAgICByZXR1cm4gdGhpcy51aUFjdGlvbkJ1dHRvbk1hbmFnZXI7XG4gICAgfVxuXG4gICAgcHVibGljIGdldFNpZ25hdHVyZU1hbmFnZXIoKTogQXBwU2lnbmF0dXJlTWFuYWdlciB7XG4gICAgICAgIHJldHVybiB0aGlzLnNpZ25hdHVyZU1hbmFnZXI7XG4gICAgfVxuXG4gICAgcHVibGljIGdldFJ1bnRpbWUoKTogQXBwUnVudGltZU1hbmFnZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5ydW50aW1lO1xuICAgIH1cblxuICAgIC8qKiBHZXRzIHdoZXRoZXIgdGhlIEFwcHMgaGF2ZSBiZWVuIGxvYWRlZCBvciBub3QuICovXG4gICAgcHVibGljIGFyZUFwcHNMb2FkZWQoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLmlzTG9hZGVkO1xuICAgIH1cblxuICAgIHB1YmxpYyBzZXRTb3VyY2VTdG9yYWdlKHN0b3JhZ2U6IEFwcFNvdXJjZVN0b3JhZ2UpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5hcHBTb3VyY2VTdG9yYWdlID0gc3RvcmFnZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHb2VzIHRocm91Z2ggdGhlIGVudGlyZSBsb2FkaW5nIHVwIHByb2Nlc3MuXG4gICAgICogRXhwZWN0IHRoaXMgdG8gdGFrZSBzb21lIHRpbWUsIGFzIGl0IGdvZXMgdGhyb3VnaCBhIHZlcnlcbiAgICAgKiBsb25nIHByb2Nlc3Mgb2YgbG9hZGluZyBhbGwgdGhlIEFwcHMgdXAuXG4gICAgICovXG4gICAgcHVibGljIGFzeW5jIGxvYWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIC8vIFlvdSBjYW4gbm90IGxvYWQgdGhlIEFwcE1hbmFnZXIgc3lzdGVtIGFnYWluXG4gICAgICAgIC8vIGlmIGl0IGhhcyBhbHJlYWR5IGJlZW4gbG9hZGVkLlxuICAgICAgICBpZiAodGhpcy5pc0xvYWRlZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpdGVtczogTWFwPHN0cmluZywgSUFwcFN0b3JhZ2VJdGVtPiA9IGF3YWl0IHRoaXMuYXBwTWV0YWRhdGFTdG9yYWdlLnJldHJpZXZlQWxsKCk7XG5cbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIGl0ZW1zLnZhbHVlcygpKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFwcFBhY2thZ2UgPSBhd2FpdCB0aGlzLmFwcFNvdXJjZVN0b3JhZ2UuZmV0Y2goaXRlbSk7XG4gICAgICAgICAgICAgICAgY29uc3QgdW5wYWNrYWdlUmVzdWx0ID0gYXdhaXQgdGhpcy5nZXRQYXJzZXIoKS51bnBhY2thZ2VBcHAoYXBwUGFja2FnZSk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBhcHAgPSBhd2FpdCB0aGlzLmdldENvbXBpbGVyKCkudG9TYW5kQm94KHRoaXMsIGl0ZW0sIHVucGFja2FnZVJlc3VsdCk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmFwcHMuc2V0KGl0ZW0uaWQsIGFwcCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBFcnJvciB3aGlsZSBjb21waWxpbmcgdGhlIEFwcCBcIiR7aXRlbS5pbmZvLm5hbWV9ICgke2l0ZW0uaWR9KVwiOmApO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBwcmwgPSBuZXcgUHJveGllZEFwcCh0aGlzLCBpdGVtLCB7XG4gICAgICAgICAgICAgICAgICAgIC8vIE1heWJlIHdlIHNob3VsZCBoYXZlIGFuIFwiRW1wdHlSdW50aW1lXCIgY2xhc3MgZm9yIHRoaXM/XG4gICAgICAgICAgICAgICAgICAgIGdldFN0YXR1cygpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoQXBwU3RhdHVzLkNPTVBJTEVSX0VSUk9SX0RJU0FCTEVEKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9IGFzIHVua25vd24gYXMgRGVub1J1bnRpbWVTdWJwcm9jZXNzQ29udHJvbGxlcik7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmFwcHMuc2V0KGl0ZW0uaWQsIHBybCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmlzTG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGVuYWJsZUFsbCgpOiBQcm9taXNlPEFycmF5PEFwcEZhYnJpY2F0aW9uRnVsZmlsbG1lbnQ+PiB7XG4gICAgICAgIGNvbnN0IGFmZnM6IEFycmF5PEFwcEZhYnJpY2F0aW9uRnVsZmlsbG1lbnQ+ID0gW107XG5cbiAgICAgICAgLy8gTGV0J3MgaW5pdGlhbGl6ZSB0aGVtXG4gICAgICAgIGZvciAoY29uc3Qgcmwgb2YgdGhpcy5hcHBzLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBjb25zdCBhZmYgPSBuZXcgQXBwRmFicmljYXRpb25GdWxmaWxsbWVudCgpO1xuXG4gICAgICAgICAgICBhZmYuc2V0QXBwSW5mbyhybC5nZXRJbmZvKCkpO1xuICAgICAgICAgICAgYWZmLnNldEltcGxlbWVudGVkSW50ZXJmYWNlcyhybC5nZXRJbXBsZW1lbnRhdGlvbkxpc3QoKSk7XG4gICAgICAgICAgICBhZmYuc2V0QXBwKHJsKTtcbiAgICAgICAgICAgIGFmZnMucHVzaChhZmYpO1xuXG4gICAgICAgICAgICBpZiAoQXBwU3RhdHVzVXRpbHMuaXNEaXNhYmxlZChhd2FpdCBybC5nZXRTdGF0dXMoKSkpIHtcbiAgICAgICAgICAgICAgICAvLyBVc3VhbGx5IGlmIGFuIEFwcCBpcyBkaXNhYmxlZCBiZWZvcmUgaXQncyBpbml0aWFsaXplZCxcbiAgICAgICAgICAgICAgICAvLyB0aGVuIHNvbWV0aGluZyAoc3VjaCBhcyBhbiBlcnJvcikgb2NjdXJlZCB3aGlsZVxuICAgICAgICAgICAgICAgIC8vIGl0IHdhcyBjb21waWxlZCBvciBzb21ldGhpbmcgc2ltaWxhci5cbiAgICAgICAgICAgICAgICAvLyBXZSBzdGlsbCBoYXZlIHRvIHZhbGlkYXRlIGl0cyBsaWNlbnNlLCB0aG91Z2hcbiAgICAgICAgICAgICAgICBhd2FpdCBybC52YWxpZGF0ZUxpY2Vuc2UoKTtcblxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmluaXRpYWxpemVBcHAocmwuZ2V0U3RvcmFnZUl0ZW0oKSwgcmwsIGZhbHNlLCB0cnVlKS5jYXRjaChjb25zb2xlLmVycm9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIExldCdzIGVuc3VyZSB0aGUgcmVxdWlyZWQgc2V0dGluZ3MgYXJlIGFsbCBzZXRcbiAgICAgICAgZm9yIChjb25zdCBybCBvZiB0aGlzLmFwcHMudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIGlmIChBcHBTdGF0dXNVdGlscy5pc0Rpc2FibGVkKGF3YWl0IHJsLmdldFN0YXR1cygpKSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIXRoaXMuYXJlUmVxdWlyZWRTZXR0aW5nc1NldChybC5nZXRTdG9yYWdlSXRlbSgpKSkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHJsLnNldFN0YXR1cyhBcHBTdGF0dXMuSU5WQUxJRF9TRVRUSU5HU19ESVNBQkxFRCkuY2F0Y2goY29uc29sZS5lcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBOb3cgbGV0J3MgZW5hYmxlIHRoZSBhcHBzIHdoaWNoIHdlcmUgb25jZSBlbmFibGVkXG4gICAgICAgIC8vIGJ1dCBhcmUgbm90IGN1cnJlbnRseSBkaXNhYmxlZC5cbiAgICAgICAgZm9yIChjb25zdCBhcHAgb2YgdGhpcy5hcHBzLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBjb25zdCBzdGF0dXMgPSBhd2FpdCBhcHAuZ2V0U3RhdHVzKCk7XG4gICAgICAgICAgICBpZiAoIUFwcFN0YXR1c1V0aWxzLmlzRGlzYWJsZWQoc3RhdHVzKSAmJiBBcHBTdGF0dXNVdGlscy5pc0VuYWJsZWQoYXBwLmdldFByZXZpb3VzU3RhdHVzKCkpKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5lbmFibGVBcHAoYXBwLmdldFN0b3JhZ2VJdGVtKCksIGFwcCwgdHJ1ZSwgYXBwLmdldFByZXZpb3VzU3RhdHVzKCkgPT09IEFwcFN0YXR1cy5NQU5VQUxMWV9FTkFCTEVEKS5jYXRjaChjb25zb2xlLmVycm9yKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIUFwcFN0YXR1c1V0aWxzLmlzRXJyb3Ioc3RhdHVzKSkge1xuICAgICAgICAgICAgICAgIHRoaXMubGlzdGVuZXJNYW5hZ2VyLmxvY2tFc3NlbnRpYWxFdmVudHMoYXBwKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVpQWN0aW9uQnV0dG9uTWFuYWdlci5jbGVhckFwcEFjdGlvbkJ1dHRvbnMoYXBwLmdldElEKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGFmZnM7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIHVubG9hZChpc01hbnVhbDogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICAvLyBJZiB0aGUgQXBwTWFuYWdlciBoYXNuJ3QgYmVlbiBsb2FkZWQgeWV0LCB0aGVuXG4gICAgICAgIC8vIHRoZXJlIGlzIG5vdGhpbmcgdG8gdW5sb2FkXG4gICAgICAgIGlmICghdGhpcy5pc0xvYWRlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChjb25zdCBhcHAgb2YgdGhpcy5hcHBzLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBjb25zdCBzdGF0dXMgPSBhd2FpdCBhcHAuZ2V0U3RhdHVzKCk7XG4gICAgICAgICAgICBpZiAoc3RhdHVzID09PSBBcHBTdGF0dXMuSU5JVElBTElaRUQpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnB1cmdlQXBwQ29uZmlnKGFwcCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCFBcHBTdGF0dXNVdGlscy5pc0Rpc2FibGVkKHN0YXR1cykpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmRpc2FibGUoYXBwLmdldElEKCksIGlzTWFudWFsID8gQXBwU3RhdHVzLk1BTlVBTExZX0RJU0FCTEVEIDogQXBwU3RhdHVzLkRJU0FCTEVEKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5saXN0ZW5lck1hbmFnZXIucmVsZWFzZUVzc2VudGlhbEV2ZW50cyhhcHApO1xuXG4gICAgICAgICAgICBhcHAuZ2V0RGVub1J1bnRpbWUoKS5zdG9wQXBwKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZW1vdmUgYWxsIHRoZSBhcHBzIGZyb20gdGhlIHN5c3RlbSBub3cgdGhhdCB3ZSBoYXZlIHVubG9hZGVkIGV2ZXJ5dGhpbmdcbiAgICAgICAgdGhpcy5hcHBzLmNsZWFyKCk7XG5cbiAgICAgICAgdGhpcy5pc0xvYWRlZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIC8qKiBHZXRzIHRoZSBBcHBzIHdoaWNoIG1hdGNoIHRoZSBmaWx0ZXIgcGFzc2VkIGluLiAqL1xuICAgIHB1YmxpYyBhc3luYyBnZXQoZmlsdGVyPzogSUdldEFwcHNGaWx0ZXIpOiBQcm9taXNlPFByb3hpZWRBcHBbXT4ge1xuICAgICAgICBsZXQgcmxzOiBBcnJheTxQcm94aWVkQXBwPiA9IFtdO1xuXG4gICAgICAgIGlmICh0eXBlb2YgZmlsdGVyID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhpcy5hcHBzLmZvckVhY2goKHJsKSA9PiBybHMucHVzaChybCkpO1xuXG4gICAgICAgICAgICByZXR1cm4gcmxzO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG5vdGhpbmcgPSB0cnVlO1xuXG4gICAgICAgIGlmICh0eXBlb2YgZmlsdGVyLmVuYWJsZWQgPT09ICdib29sZWFuJyAmJiBmaWx0ZXIuZW5hYmxlZCkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBybCBvZiB0aGlzLmFwcHMudmFsdWVzKCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoQXBwU3RhdHVzVXRpbHMuaXNFbmFibGVkKGF3YWl0IHJsLmdldFN0YXR1cygpKSkge1xuICAgICAgICAgICAgICAgICAgICBybHMucHVzaChybCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBub3RoaW5nID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIGZpbHRlci5kaXNhYmxlZCA9PT0gJ2Jvb2xlYW4nICYmIGZpbHRlci5kaXNhYmxlZCkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBybCBvZiB0aGlzLmFwcHMudmFsdWVzKCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoQXBwU3RhdHVzVXRpbHMuaXNEaXNhYmxlZChhd2FpdCBybC5nZXRTdGF0dXMoKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmxzLnB1c2gocmwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbm90aGluZyA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5vdGhpbmcpIHtcbiAgICAgICAgICAgIHRoaXMuYXBwcy5mb3JFYWNoKChybCkgPT4gcmxzLnB1c2gocmwpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgZmlsdGVyLmlkcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHJscyA9IHJscy5maWx0ZXIoKHJsKSA9PiBmaWx0ZXIuaWRzLmluY2x1ZGVzKHJsLmdldElEKCkpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgZmlsdGVyLmluc3RhbGxhdGlvblNvdXJjZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHJscyA9IHJscy5maWx0ZXIoKHJsKSA9PiBybC5nZXRJbnN0YWxsYXRpb25Tb3VyY2UoKSA9PT0gZmlsdGVyLmluc3RhbGxhdGlvblNvdXJjZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIGZpbHRlci5uYW1lID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcmxzID0gcmxzLmZpbHRlcigocmwpID0+IHJsLmdldE5hbWUoKSA9PT0gZmlsdGVyLm5hbWUpO1xuICAgICAgICB9IGVsc2UgaWYgKGZpbHRlci5uYW1lIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICAgICAgICBybHMgPSBybHMuZmlsdGVyKChybCkgPT4gKGZpbHRlci5uYW1lIGFzIFJlZ0V4cCkudGVzdChybC5nZXROYW1lKCkpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBybHM7XG4gICAgfVxuXG4gICAgLyoqIEdldHMgYSBzaW5nbGUgQXBwIGJ5IHRoZSBpZCBwYXNzZWQgaW4uICovXG4gICAgcHVibGljIGdldE9uZUJ5SWQoYXBwSWQ6IHN0cmluZyk6IFByb3hpZWRBcHAge1xuICAgICAgICByZXR1cm4gdGhpcy5hcHBzLmdldChhcHBJZCk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldFBlcm1pc3Npb25zQnlJZChhcHBJZDogc3RyaW5nKTogQXJyYXk8SVBlcm1pc3Npb24+IHtcbiAgICAgICAgY29uc3QgYXBwID0gdGhpcy5hcHBzLmdldChhcHBJZCk7XG5cbiAgICAgICAgaWYgKCFhcHApIHtcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB7IHBlcm1pc3Npb25zR3JhbnRlZCB9ID0gYXBwLmdldFN0b3JhZ2VJdGVtKCk7XG5cbiAgICAgICAgcmV0dXJuIHBlcm1pc3Npb25zR3JhbnRlZCB8fCBkZWZhdWx0UGVybWlzc2lvbnM7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGVuYWJsZShpZDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIGNvbnN0IHJsID0gdGhpcy5hcHBzLmdldChpZCk7XG5cbiAgICAgICAgaWYgKCFybCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyBBcHAgYnkgdGhlIGlkIFwiJHtpZH1cIiBleGlzdHMuYCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzdGF0dXMgPSBhd2FpdCBybC5nZXRTdGF0dXMoKTtcblxuICAgICAgICBpZiAoQXBwU3RhdHVzVXRpbHMuaXNFbmFibGVkKHN0YXR1cykpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHN0YXR1cyA9PT0gQXBwU3RhdHVzLkNPTVBJTEVSX0VSUk9SX0RJU0FCTEVEKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBBcHAgaGFkIGNvbXBpbGVyIGVycm9ycywgY2FuIG5vdCBlbmFibGUgaXQuJyk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzdG9yYWdlSXRlbSA9IGF3YWl0IHRoaXMuYXBwTWV0YWRhdGFTdG9yYWdlLnJldHJpZXZlT25lKGlkKTtcblxuICAgICAgICBpZiAoIXN0b3JhZ2VJdGVtKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCBlbmFibGUgYW4gQXBwIHdpdGggdGhlIGlkIG9mIFwiJHtpZH1cIiBhcyBpdCBkb2Vzbid0IGV4aXN0LmApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaXNTZXR1cCA9IGF3YWl0IHRoaXMucnVuU3RhcnRVcFByb2Nlc3Moc3RvcmFnZUl0ZW0sIHJsLCB0cnVlLCBmYWxzZSk7XG5cbiAgICAgICAgaWYgKGlzU2V0dXApIHtcbiAgICAgICAgICAgIHN0b3JhZ2VJdGVtLnN0YXR1cyA9IGF3YWl0IHJsLmdldFN0YXR1cygpO1xuICAgICAgICAgICAgLy8gVGhpcyBpcyBhc3luYywgYnV0IHdlIGRvbid0IGNhcmUgc2luY2UgaXQgb25seSB1cGRhdGVzIGluIHRoZSBkYXRhYmFzZVxuICAgICAgICAgICAgLy8gYW5kIGl0IHNob3VsZCBub3QgbXV0YXRlIGFueSBwcm9wZXJ0aWVzIHdlIGNhcmUgYWJvdXRcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuYXBwTWV0YWRhdGFTdG9yYWdlLnVwZGF0ZShzdG9yYWdlSXRlbSkuY2F0Y2goKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBpc1NldHVwO1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBkaXNhYmxlKGlkOiBzdHJpbmcsIHN0YXR1czogQXBwU3RhdHVzID0gQXBwU3RhdHVzLkRJU0FCTEVELCBzaWxlbnQ/OiBib29sZWFuKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIGlmICghQXBwU3RhdHVzVXRpbHMuaXNEaXNhYmxlZChzdGF0dXMpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgZGlzYWJsZWQgc3RhdHVzJyk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBhcHAgPSB0aGlzLmFwcHMuZ2V0KGlkKTtcblxuICAgICAgICBpZiAoIWFwcCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyBBcHAgYnkgdGhlIGlkIFwiJHtpZH1cIiBleGlzdHMuYCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoQXBwU3RhdHVzVXRpbHMuaXNFbmFibGVkKGF3YWl0IGFwcC5nZXRTdGF0dXMoKSkpIHtcbiAgICAgICAgICAgIGF3YWl0IGFwcC5jYWxsKEFwcE1ldGhvZC5PTkRJU0FCTEUpLmNhdGNoKChlKSA9PiBjb25zb2xlLndhcm4oJ0Vycm9yIHdoaWxlIGRpc2FibGluZzonLCBlKSk7XG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCB0aGlzLnB1cmdlQXBwQ29uZmlnKGFwcCwgeyBrZWVwU2NoZWR1bGVkSm9iczogdHJ1ZSB9KTtcblxuICAgICAgICBhd2FpdCBhcHAuc2V0U3RhdHVzKHN0YXR1cywgc2lsZW50KTtcblxuICAgICAgICBjb25zdCBzdG9yYWdlSXRlbSA9IGF3YWl0IHRoaXMuYXBwTWV0YWRhdGFTdG9yYWdlLnJldHJpZXZlT25lKGlkKTtcblxuICAgICAgICBhcHAuZ2V0U3RvcmFnZUl0ZW0oKS5tYXJrZXRwbGFjZUluZm8gPSBzdG9yYWdlSXRlbS5tYXJrZXRwbGFjZUluZm87XG4gICAgICAgIGF3YWl0IGFwcC52YWxpZGF0ZUxpY2Vuc2UoKS5jYXRjaCgpO1xuXG4gICAgICAgIHN0b3JhZ2VJdGVtLnN0YXR1cyA9IGF3YWl0IGFwcC5nZXRTdGF0dXMoKTtcbiAgICAgICAgLy8gVGhpcyBpcyBhc3luYywgYnV0IHdlIGRvbid0IGNhcmUgc2luY2UgaXQgb25seSB1cGRhdGVzIGluIHRoZSBkYXRhYmFzZVxuICAgICAgICAvLyBhbmQgaXQgc2hvdWxkIG5vdCBtdXRhdGUgYW55IHByb3BlcnRpZXMgd2UgY2FyZSBhYm91dFxuICAgICAgICBhd2FpdCB0aGlzLmFwcE1ldGFkYXRhU3RvcmFnZS51cGRhdGUoc3RvcmFnZUl0ZW0pLmNhdGNoKCk7XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIG1pZ3JhdGUoaWQ6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBjb25zdCBhcHAgPSB0aGlzLmFwcHMuZ2V0KGlkKTtcblxuICAgICAgICBpZiAoIWFwcCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyBBcHAgYnkgdGhlIGlkIFwiJHtpZH1cIiBleGlzdHMuYCk7XG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCBhcHAuY2FsbChBcHBNZXRob2QuT05VUERBVEUpLmNhdGNoKChlKSA9PiBjb25zb2xlLndhcm4oJ0Vycm9yIHdoaWxlIG1pZ3JhdGluZzonLCBlKSk7XG5cbiAgICAgICAgYXdhaXQgdGhpcy5wdXJnZUFwcENvbmZpZyhhcHAsIHsga2VlcFNjaGVkdWxlZEpvYnM6IHRydWUgfSk7XG5cbiAgICAgICAgY29uc3Qgc3RvcmFnZUl0ZW0gPSBhd2FpdCB0aGlzLmFwcE1ldGFkYXRhU3RvcmFnZS5yZXRyaWV2ZU9uZShpZCk7XG5cbiAgICAgICAgYXBwLmdldFN0b3JhZ2VJdGVtKCkubWFya2V0cGxhY2VJbmZvID0gc3RvcmFnZUl0ZW0ubWFya2V0cGxhY2VJbmZvO1xuICAgICAgICBhd2FpdCBhcHAudmFsaWRhdGVMaWNlbnNlKCkuY2F0Y2goKTtcblxuICAgICAgICBzdG9yYWdlSXRlbS5taWdyYXRlZCA9IHRydWU7XG4gICAgICAgIHN0b3JhZ2VJdGVtLnNpZ25hdHVyZSA9IGF3YWl0IHRoaXMuZ2V0U2lnbmF0dXJlTWFuYWdlcigpLnNpZ25BcHAoc3RvcmFnZUl0ZW0pO1xuICAgICAgICAvLyBUaGlzIGlzIGFzeW5jLCBidXQgd2UgZG9uJ3QgY2FyZSBzaW5jZSBpdCBvbmx5IHVwZGF0ZXMgaW4gdGhlIGRhdGFiYXNlXG4gICAgICAgIC8vIGFuZCBpdCBzaG91bGQgbm90IG11dGF0ZSBhbnkgcHJvcGVydGllcyB3ZSBjYXJlIGFib3V0XG4gICAgICAgIGNvbnN0IHN0b3JlZCA9IGF3YWl0IHRoaXMuYXBwTWV0YWRhdGFTdG9yYWdlLnVwZGF0ZShzdG9yYWdlSXRlbSkuY2F0Y2goKTtcblxuICAgICAgICBhd2FpdCB0aGlzLnVwZGF0ZUxvY2FsKHN0b3JlZCwgYXBwKTtcbiAgICAgICAgYXdhaXQgdGhpcy5icmlkZ2VzXG4gICAgICAgICAgICAuZ2V0QXBwQWN0aXZhdGlvbkJyaWRnZSgpXG4gICAgICAgICAgICAuZG9BcHBVcGRhdGVkKGFwcClcbiAgICAgICAgICAgIC5jYXRjaCgoKSA9PiB7fSk7XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGFkZExvY2FsKGFwcElkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3Qgc3RvcmFnZUl0ZW0gPSBhd2FpdCB0aGlzLmFwcE1ldGFkYXRhU3RvcmFnZS5yZXRyaWV2ZU9uZShhcHBJZCk7XG5cbiAgICAgICAgaWYgKCFzdG9yYWdlSXRlbSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBBcHAgd2l0aCBpZCAke2FwcElkfSBjb3VsZG4ndCBiZSBmb3VuZGApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYXBwUGFja2FnZSA9IGF3YWl0IHRoaXMuYXBwU291cmNlU3RvcmFnZS5mZXRjaChzdG9yYWdlSXRlbSk7XG5cbiAgICAgICAgaWYgKCFhcHBQYWNrYWdlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFBhY2thZ2UgZmlsZSBmb3IgYXBwIFwiJHtzdG9yYWdlSXRlbS5pbmZvLm5hbWV9XCIgKCR7YXBwSWR9KSBjb3VsZG4ndCBiZSBmb3VuZGApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcGFyc2VkUGFja2FnZSA9IGF3YWl0IHRoaXMuZ2V0UGFyc2VyKCkudW5wYWNrYWdlQXBwKGFwcFBhY2thZ2UpO1xuICAgICAgICBjb25zdCBhcHAgPSBhd2FpdCB0aGlzLmdldENvbXBpbGVyKCkudG9TYW5kQm94KHRoaXMsIHN0b3JhZ2VJdGVtLCBwYXJzZWRQYWNrYWdlKTtcblxuICAgICAgICB0aGlzLmFwcHMuc2V0KGFwcC5nZXRJRCgpLCBhcHApO1xuXG4gICAgICAgIGF3YWl0IHRoaXMubG9hZE9uZShhcHBJZCk7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGFkZChhcHBQYWNrYWdlOiBCdWZmZXIsIGluc3RhbGxhdGlvblBhcmFtZXRlcnM6IElBcHBJbnN0YWxsUGFyYW1ldGVycyk6IFByb21pc2U8QXBwRmFicmljYXRpb25GdWxmaWxsbWVudD4ge1xuICAgICAgICBjb25zdCB7IGVuYWJsZSA9IHRydWUsIG1hcmtldHBsYWNlSW5mbywgcGVybWlzc2lvbnNHcmFudGVkLCB1c2VyIH0gPSBpbnN0YWxsYXRpb25QYXJhbWV0ZXJzO1xuXG4gICAgICAgIGNvbnN0IGFmZiA9IG5ldyBBcHBGYWJyaWNhdGlvbkZ1bGZpbGxtZW50KCk7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuZ2V0UGFyc2VyKCkudW5wYWNrYWdlQXBwKGFwcFBhY2thZ2UpO1xuICAgICAgICBjb25zdCB1bmRvU3RlcHM6IEFycmF5PCgpID0+IHZvaWQ+ID0gW107XG5cbiAgICAgICAgYWZmLnNldEFwcEluZm8ocmVzdWx0LmluZm8pO1xuICAgICAgICBhZmYuc2V0SW1wbGVtZW50ZWRJbnRlcmZhY2VzKHJlc3VsdC5pbXBsZW1lbnRlZC5nZXRWYWx1ZXMoKSk7XG5cbiAgICAgICAgY29uc3QgZGVzY3JpcHRvcjogSUFwcFN0b3JhZ2VJdGVtID0ge1xuICAgICAgICAgICAgaWQ6IHJlc3VsdC5pbmZvLmlkLFxuICAgICAgICAgICAgaW5mbzogcmVzdWx0LmluZm8sXG4gICAgICAgICAgICBzdGF0dXM6IEFwcFN0YXR1cy5VTktOT1dOLFxuICAgICAgICAgICAgc2V0dGluZ3M6IHt9LFxuICAgICAgICAgICAgaW1wbGVtZW50ZWQ6IHJlc3VsdC5pbXBsZW1lbnRlZC5nZXRWYWx1ZXMoKSxcbiAgICAgICAgICAgIGluc3RhbGxhdGlvblNvdXJjZTogbWFya2V0cGxhY2VJbmZvID8gQXBwSW5zdGFsbGF0aW9uU291cmNlLk1BUktFVFBMQUNFIDogQXBwSW5zdGFsbGF0aW9uU291cmNlLlBSSVZBVEUsXG4gICAgICAgICAgICBtYXJrZXRwbGFjZUluZm8sXG4gICAgICAgICAgICBwZXJtaXNzaW9uc0dyYW50ZWQsXG4gICAgICAgICAgICBsYW5ndWFnZUNvbnRlbnQ6IHJlc3VsdC5sYW5ndWFnZUNvbnRlbnQsXG4gICAgICAgIH07XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGRlc2NyaXB0b3Iuc291cmNlUGF0aCA9IGF3YWl0IHRoaXMuYXBwU291cmNlU3RvcmFnZS5zdG9yZShkZXNjcmlwdG9yLCBhcHBQYWNrYWdlKTtcblxuICAgICAgICAgICAgdW5kb1N0ZXBzLnB1c2goKCkgPT4gdGhpcy5hcHBTb3VyY2VTdG9yYWdlLnJlbW92ZShkZXNjcmlwdG9yKSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBhZmYuc2V0U3RvcmFnZUVycm9yKCdGYWlsZWQgdG8gc3RvcmUgYXBwIHBhY2thZ2UnKTtcblxuICAgICAgICAgICAgcmV0dXJuIGFmZjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE5vdyB0aGF0IGlzIGhhcyBhbGwgYmVlbiBjb21waWxlZCwgbGV0J3MgZ2V0IHRoZVxuICAgICAgICAvLyB0aGUgQXBwIGluc3RhbmNlIGZyb20gdGhlIHNvdXJjZS5cbiAgICAgICAgY29uc3QgYXBwID0gYXdhaXQgdGhpcy5nZXRDb21waWxlcigpLnRvU2FuZEJveCh0aGlzLCBkZXNjcmlwdG9yLCByZXN1bHQpO1xuXG4gICAgICAgIHVuZG9TdGVwcy5wdXNoKCgpID0+XG4gICAgICAgICAgICB0aGlzLmdldFJ1bnRpbWUoKVxuICAgICAgICAgICAgICAgIC5zdG9wUnVudGltZShhcHAuZ2V0RGVub1J1bnRpbWUoKSlcbiAgICAgICAgICAgICAgICAuY2F0Y2goKCkgPT4ge30pLFxuICAgICAgICApO1xuXG4gICAgICAgIC8vIENyZWF0ZSBhIHVzZXIgZm9yIHRoZSBhcHBcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY3JlYXRlQXBwVXNlcihyZXN1bHQuaW5mbyk7XG5cbiAgICAgICAgICAgIHVuZG9TdGVwcy5wdXNoKCgpID0+IHRoaXMucmVtb3ZlQXBwVXNlcihhcHApKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBhZmYuc2V0QXBwVXNlckVycm9yKHtcbiAgICAgICAgICAgICAgICB1c2VybmFtZTogYCR7cmVzdWx0LmluZm8ubmFtZVNsdWd9LmJvdGAsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ0ZhaWxlZCB0byBjcmVhdGUgYW4gYXBwIHVzZXIgZm9yIHRoaXMgYXBwLicsXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwodW5kb1N0ZXBzLm1hcCgodW5kb2VyKSA9PiB1bmRvZXIoKSkpO1xuXG4gICAgICAgICAgICByZXR1cm4gYWZmO1xuICAgICAgICB9XG5cbiAgICAgICAgZGVzY3JpcHRvci5zaWduYXR1cmUgPSBhd2FpdCB0aGlzLmdldFNpZ25hdHVyZU1hbmFnZXIoKS5zaWduQXBwKGRlc2NyaXB0b3IpO1xuICAgICAgICBjb25zdCBjcmVhdGVkID0gYXdhaXQgdGhpcy5hcHBNZXRhZGF0YVN0b3JhZ2UuY3JlYXRlKGRlc2NyaXB0b3IpO1xuXG4gICAgICAgIGlmICghY3JlYXRlZCkge1xuICAgICAgICAgICAgYWZmLnNldFN0b3JhZ2VFcnJvcignRmFpbGVkIHRvIGNyZWF0ZSB0aGUgQXBwLCB0aGUgc3RvcmFnZSBkaWQgbm90IHJldHVybiBpdC4nKTtcblxuICAgICAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwodW5kb1N0ZXBzLm1hcCgodW5kb2VyKSA9PiB1bmRvZXIoKSkpO1xuXG4gICAgICAgICAgICByZXR1cm4gYWZmO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5hcHBzLnNldChhcHAuZ2V0SUQoKSwgYXBwKTtcbiAgICAgICAgYWZmLnNldEFwcChhcHApO1xuXG4gICAgICAgIC8vIExldCBldmVyeW9uZSBrbm93IHRoYXQgdGhlIEFwcCBoYXMgYmVlbiBhZGRlZFxuICAgICAgICBhd2FpdCB0aGlzLmJyaWRnZXNcbiAgICAgICAgICAgIC5nZXRBcHBBY3RpdmF0aW9uQnJpZGdlKClcbiAgICAgICAgICAgIC5kb0FwcEFkZGVkKGFwcClcbiAgICAgICAgICAgIC5jYXRjaCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gSWYgYW4gZXJyb3Igb2NjdXJzIGR1cmluZyB0aGlzLCBvaCB3ZWxsLlxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgYXdhaXQgdGhpcy5pbnN0YWxsQXBwKGNyZWF0ZWQsIGFwcCwgdXNlcik7XG5cbiAgICAgICAgLy8gU2hvdWxkIGVuYWJsZSA9PT0gdHJ1ZSwgdGhlbiB3ZSBnbyB0aHJvdWdoIHRoZSBlbnRpcmUgc3RhcnQgdXAgcHJvY2Vzc1xuICAgICAgICAvLyBPdGhlcndpc2UsIHdlIG9ubHkgaW5pdGlhbGl6ZSBpdC5cbiAgICAgICAgaWYgKGVuYWJsZSkge1xuICAgICAgICAgICAgLy8gU3RhcnQgdXAgdGhlIGFwcFxuICAgICAgICAgICAgYXdhaXQgdGhpcy5ydW5TdGFydFVwUHJvY2VzcyhjcmVhdGVkLCBhcHAsIGZhbHNlLCBmYWxzZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmluaXRpYWxpemVBcHAoY3JlYXRlZCwgYXBwLCB0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBhZmY7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVW5pbnN0YWxscyBzcGVjaWZpZWQgYXBwIGZyb20gdGhlIHNlcnZlciBhbmQgcmVtb3ZlXG4gICAgICogYWxsIGRhdGFiYXNlIHJlY29yZHMgcmVnYXJkaW5nIGl0XG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB0aGUgaW5zdGFuY2Ugb2YgdGhlIHJlbW92ZWQgUHJveGllZEFwcFxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyByZW1vdmUoaWQ6IHN0cmluZywgdW5pbnN0YWxsYXRpb25QYXJhbWV0ZXJzOiBJQXBwVW5pbnN0YWxsUGFyYW1ldGVycyk6IFByb21pc2U8UHJveGllZEFwcD4ge1xuICAgICAgICBjb25zdCBhcHAgPSB0aGlzLmFwcHMuZ2V0KGlkKTtcbiAgICAgICAgY29uc3QgeyB1c2VyIH0gPSB1bmluc3RhbGxhdGlvblBhcmFtZXRlcnM7XG5cbiAgICAgICAgLy8gRmlyc3QgcmVtb3ZlIHRoZSBhcHBcbiAgICAgICAgYXdhaXQgdGhpcy51bmluc3RhbGxBcHAoYXBwLCB1c2VyKTtcbiAgICAgICAgYXdhaXQgdGhpcy5yZW1vdmVMb2NhbChpZCk7XG5cbiAgICAgICAgLy8gVGhlbiBsZXQgZXZlcnlvbmUga25vdyB0aGF0IHRoZSBBcHAgaGFzIGJlZW4gcmVtb3ZlZFxuICAgICAgICBhd2FpdCB0aGlzLmJyaWRnZXMuZ2V0QXBwQWN0aXZhdGlvbkJyaWRnZSgpLmRvQXBwUmVtb3ZlZChhcHApLmNhdGNoKCk7XG5cbiAgICAgICAgcmV0dXJuIGFwcDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIHRoZSBhcHAgaW5zdGFuY2UgZnJvbSB0aGUgbG9jYWwgQXBwcyBjb250YWluZXJcbiAgICAgKiBhbmQgZXZlcnkgdHlwZSBvZiBkYXRhIGFzc29jaWF0ZWQgd2l0aCBpdFxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyByZW1vdmVMb2NhbChpZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IGFwcCA9IHRoaXMuYXBwcy5nZXQoaWQpO1xuXG4gICAgICAgIGlmIChBcHBTdGF0dXNVdGlscy5pc0VuYWJsZWQoYXdhaXQgYXBwLmdldFN0YXR1cygpKSkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5kaXNhYmxlKGlkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IHRoaXMucHVyZ2VBcHBDb25maWcoYXBwKTtcbiAgICAgICAgdGhpcy5saXN0ZW5lck1hbmFnZXIucmVsZWFzZUVzc2VudGlhbEV2ZW50cyhhcHApO1xuICAgICAgICBhd2FpdCB0aGlzLnJlbW92ZUFwcFVzZXIoYXBwKTtcbiAgICAgICAgYXdhaXQgKHRoaXMuYnJpZGdlcy5nZXRQZXJzaXN0ZW5jZUJyaWRnZSgpIGFzIElJbnRlcm5hbFBlcnNpc3RlbmNlQnJpZGdlICYgUGVyc2lzdGVuY2VCcmlkZ2UpLnB1cmdlKGFwcC5nZXRJRCgpKTtcbiAgICAgICAgYXdhaXQgdGhpcy5hcHBNZXRhZGF0YVN0b3JhZ2UucmVtb3ZlKGFwcC5nZXRJRCgpKTtcbiAgICAgICAgYXdhaXQgdGhpcy5hcHBTb3VyY2VTdG9yYWdlLnJlbW92ZShhcHAuZ2V0U3RvcmFnZUl0ZW0oKSkuY2F0Y2goKCkgPT4ge30pO1xuXG4gICAgICAgIC8vIEVycm9ycyBoZXJlIGRvbid0IHJlYWxseSBwcmV2ZW50IHRoZSBwcm9jZXNzIGZyb20gZHlpbmcsIHNvIHdlIGRvbid0IHJlYWxseSBuZWVkIHRvIGRvIGFueXRoaW5nIG9uIHRoZSBjYXRjaFxuICAgICAgICBhd2FpdCB0aGlzLmdldFJ1bnRpbWUoKVxuICAgICAgICAgICAgLnN0b3BSdW50aW1lKGFwcC5nZXREZW5vUnVudGltZSgpKVxuICAgICAgICAgICAgLmNhdGNoKCgpID0+IHt9KTtcblxuICAgICAgICB0aGlzLmFwcHMuZGVsZXRlKGFwcC5nZXRJRCgpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgdXBkYXRlKFxuICAgICAgICBhcHBQYWNrYWdlOiBCdWZmZXIsXG4gICAgICAgIHBlcm1pc3Npb25zR3JhbnRlZDogQXJyYXk8SVBlcm1pc3Npb24+LFxuICAgICAgICB1cGRhdGVPcHRpb25zOiB7IGxvYWRBcHA/OiBib29sZWFuOyB1c2VyPzogSVVzZXIgfSA9IHsgbG9hZEFwcDogdHJ1ZSB9LFxuICAgICk6IFByb21pc2U8QXBwRmFicmljYXRpb25GdWxmaWxsbWVudD4ge1xuICAgICAgICBjb25zdCBhZmYgPSBuZXcgQXBwRmFicmljYXRpb25GdWxmaWxsbWVudCgpO1xuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmdldFBhcnNlcigpLnVucGFja2FnZUFwcChhcHBQYWNrYWdlKTtcblxuICAgICAgICBhZmYuc2V0QXBwSW5mbyhyZXN1bHQuaW5mbyk7XG4gICAgICAgIGFmZi5zZXRJbXBsZW1lbnRlZEludGVyZmFjZXMocmVzdWx0LmltcGxlbWVudGVkLmdldFZhbHVlcygpKTtcblxuICAgICAgICBjb25zdCBvbGQgPSBhd2FpdCB0aGlzLmFwcE1ldGFkYXRhU3RvcmFnZS5yZXRyaWV2ZU9uZShyZXN1bHQuaW5mby5pZCk7XG5cbiAgICAgICAgaWYgKCFvbGQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2FuIG5vdCB1cGRhdGUgYW4gQXBwIHRoYXQgZG9lcyBub3QgY3VycmVudGx5IGV4aXN0LicpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgdGhlcmUgaXMgYW55IGVycm9yIGR1cmluZyBkaXNhYmxpbmcsIGl0IGRvZXNuJ3QgcmVhbGx5IG1hdHRlclxuICAgICAgICBhd2FpdCB0aGlzLmRpc2FibGUob2xkLmlkKS5jYXRjaCgoKSA9PiB7fSk7XG5cbiAgICAgICAgY29uc3QgZGVzY3JpcHRvcjogSUFwcFN0b3JhZ2VJdGVtID0ge1xuICAgICAgICAgICAgLi4ub2xkLFxuICAgICAgICAgICAgY3JlYXRlZEF0OiBvbGQuY3JlYXRlZEF0LFxuICAgICAgICAgICAgaWQ6IHJlc3VsdC5pbmZvLmlkLFxuICAgICAgICAgICAgaW5mbzogcmVzdWx0LmluZm8sXG4gICAgICAgICAgICBzdGF0dXM6IChhd2FpdCB0aGlzLmFwcHMuZ2V0KG9sZC5pZCk/LmdldFN0YXR1cygpKSB8fCBvbGQuc3RhdHVzLFxuICAgICAgICAgICAgbGFuZ3VhZ2VDb250ZW50OiByZXN1bHQubGFuZ3VhZ2VDb250ZW50LFxuICAgICAgICAgICAgc2V0dGluZ3M6IG9sZC5zZXR0aW5ncyxcbiAgICAgICAgICAgIGltcGxlbWVudGVkOiByZXN1bHQuaW1wbGVtZW50ZWQuZ2V0VmFsdWVzKCksXG4gICAgICAgICAgICBtYXJrZXRwbGFjZUluZm86IG9sZC5tYXJrZXRwbGFjZUluZm8sXG4gICAgICAgICAgICBzb3VyY2VQYXRoOiBvbGQuc291cmNlUGF0aCxcbiAgICAgICAgICAgIHBlcm1pc3Npb25zR3JhbnRlZCxcbiAgICAgICAgfTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgZGVzY3JpcHRvci5zb3VyY2VQYXRoID0gYXdhaXQgdGhpcy5hcHBTb3VyY2VTdG9yYWdlLnVwZGF0ZShkZXNjcmlwdG9yLCBhcHBQYWNrYWdlKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGFmZi5zZXRTdG9yYWdlRXJyb3IoJ0ZhaWxlZCB0byBzdG9yYWdlIGFwcCBwYWNrYWdlJyk7XG5cbiAgICAgICAgICAgIHJldHVybiBhZmY7XG4gICAgICAgIH1cblxuICAgICAgICBkZXNjcmlwdG9yLnNpZ25hdHVyZSA9IGF3YWl0IHRoaXMuc2lnbmF0dXJlTWFuYWdlci5zaWduQXBwKGRlc2NyaXB0b3IpO1xuICAgICAgICBjb25zdCBzdG9yZWQgPSBhd2FpdCB0aGlzLmFwcE1ldGFkYXRhU3RvcmFnZS51cGRhdGUoZGVzY3JpcHRvcik7XG5cbiAgICAgICAgLy8gRXJyb3JzIGhlcmUgZG9uJ3QgcmVhbGx5IHByZXZlbnQgdGhlIHByb2Nlc3MgZnJvbSBkeWluZywgc28gd2UgZG9uJ3QgcmVhbGx5IG5lZWQgdG8gZG8gYW55dGhpbmcgb24gdGhlIGNhdGNoXG4gICAgICAgIGF3YWl0IHRoaXMuZ2V0UnVudGltZSgpXG4gICAgICAgICAgICAuc3RvcFJ1bnRpbWUodGhpcy5hcHBzLmdldChvbGQuaWQpLmdldERlbm9SdW50aW1lKCkpXG4gICAgICAgICAgICAuY2F0Y2goKCkgPT4ge30pO1xuXG4gICAgICAgIGNvbnN0IGFwcCA9IGF3YWl0IHRoaXMuZ2V0Q29tcGlsZXIoKS50b1NhbmRCb3godGhpcywgZGVzY3JpcHRvciwgcmVzdWx0KTtcblxuICAgICAgICAvLyBFbnN1cmUgdGhlcmUgaXMgYW4gdXNlciBmb3IgdGhlIGFwcFxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5jcmVhdGVBcHBVc2VyKHJlc3VsdC5pbmZvKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBhZmYuc2V0QXBwVXNlckVycm9yKHtcbiAgICAgICAgICAgICAgICB1c2VybmFtZTogYCR7cmVzdWx0LmluZm8ubmFtZVNsdWd9LmJvdGAsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ0ZhaWxlZCB0byBjcmVhdGUgYW4gYXBwIHVzZXIgZm9yIHRoaXMgYXBwLicsXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIGFmZjtcbiAgICAgICAgfVxuXG4gICAgICAgIGFmZi5zZXRBcHAoYXBwKTtcblxuICAgICAgICBpZiAodXBkYXRlT3B0aW9ucy5sb2FkQXBwKSB7XG4gICAgICAgICAgICBjb25zdCBzaG91bGRFbmFibGVBcHAgPSBBcHBTdGF0dXNVdGlscy5pc0VuYWJsZWQob2xkLnN0YXR1cyk7XG4gICAgICAgICAgICBpZiAoc2hvdWxkRW5hYmxlQXBwKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVBbmRTdGFydHVwTG9jYWwoc3RvcmVkLCBhcHApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnVwZGF0ZUFuZEluaXRpYWxpemVMb2NhbChzdG9yZWQsIGFwcCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGF3YWl0IHRoaXMuYnJpZGdlc1xuICAgICAgICAgICAgICAgIC5nZXRBcHBBY3RpdmF0aW9uQnJpZGdlKClcbiAgICAgICAgICAgICAgICAuZG9BcHBVcGRhdGVkKGFwcClcbiAgICAgICAgICAgICAgICAuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVBcHAoYXBwLCB1cGRhdGVPcHRpb25zLnVzZXIsIG9sZC5pbmZvLnZlcnNpb24pO1xuXG4gICAgICAgIHJldHVybiBhZmY7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlcyB0aGUgbG9jYWwgaW5zdGFuY2Ugb2YgYW4gYXBwLlxuICAgICAqXG4gICAgICogSWYgdGhlIHNlY29uZCBwYXJhbWV0ZXIgaXMgYSBCdWZmZXIgb2YgYW4gYXBwIHBhY2thZ2UsXG4gICAgICogdW5wYWNrYWdlIGFuZCBpbnN0YW50aWF0ZSB0aGUgYXBwJ3MgbWFpbiBjbGFzc1xuICAgICAqXG4gICAgICogV2l0aCBhbiBpbnN0YW5jZSBvZiBhIFByb3hpZWRBcHAsIHN0YXJ0IGl0IHVwIGFuZCByZXBsYWNlXG4gICAgICogdGhlIHJlZmVyZW5jZSBpbiB0aGUgbG9jYWwgYXBwIGNvbGxlY3Rpb25cbiAgICAgKi9cbiAgICBhc3luYyB1cGRhdGVMb2NhbChzdG9yZWQ6IElBcHBTdG9yYWdlSXRlbSwgYXBwUGFja2FnZU9ySW5zdGFuY2U6IFByb3hpZWRBcHAgfCBCdWZmZXIpOiBQcm9taXNlPFByb3hpZWRBcHA+IHtcbiAgICAgICAgY29uc3QgYXBwID0gYXdhaXQgKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGlmIChhcHBQYWNrYWdlT3JJbnN0YW5jZSBpbnN0YW5jZW9mIEJ1ZmZlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhcnNlUmVzdWx0ID0gYXdhaXQgdGhpcy5nZXRQYXJzZXIoKS51bnBhY2thZ2VBcHAoYXBwUGFja2FnZU9ySW5zdGFuY2UpO1xuXG4gICAgICAgICAgICAgICAgLy8gRXJyb3JzIGhlcmUgZG9uJ3QgcmVhbGx5IHByZXZlbnQgdGhlIHByb2Nlc3MgZnJvbSBkeWluZywgc28gd2UgZG9uJ3QgcmVhbGx5IG5lZWQgdG8gZG8gYW55dGhpbmcgb24gdGhlIGNhdGNoXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5nZXRSdW50aW1lKClcbiAgICAgICAgICAgICAgICAgICAgLnN0b3BSdW50aW1lKHRoaXMuYXBwcy5nZXQoc3RvcmVkLmlkKS5nZXREZW5vUnVudGltZSgpKVxuICAgICAgICAgICAgICAgICAgICAuY2F0Y2goKCkgPT4ge30pO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q29tcGlsZXIoKS50b1NhbmRCb3godGhpcywgc3RvcmVkLCBwYXJzZVJlc3VsdCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChhcHBQYWNrYWdlT3JJbnN0YW5jZSBpbnN0YW5jZW9mIFByb3hpZWRBcHApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYXBwUGFja2FnZU9ySW5zdGFuY2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKCk7XG5cbiAgICAgICAgYXdhaXQgdGhpcy5wdXJnZUFwcENvbmZpZyhhcHAsIHsga2VlcFNjaGVkdWxlZEpvYnM6IHRydWUgfSk7XG5cbiAgICAgICAgdGhpcy5hcHBzLnNldChhcHAuZ2V0SUQoKSwgYXBwKTtcbiAgICAgICAgcmV0dXJuIGFwcDtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgdXBkYXRlQW5kU3RhcnR1cExvY2FsKHN0b3JlZDogSUFwcFN0b3JhZ2VJdGVtLCBhcHBQYWNrYWdlT3JJbnN0YW5jZTogUHJveGllZEFwcCB8IEJ1ZmZlcikge1xuICAgICAgICBjb25zdCBhcHAgPSBhd2FpdCB0aGlzLnVwZGF0ZUxvY2FsKHN0b3JlZCwgYXBwUGFja2FnZU9ySW5zdGFuY2UpO1xuICAgICAgICBhd2FpdCB0aGlzLnJ1blN0YXJ0VXBQcm9jZXNzKHN0b3JlZCwgYXBwLCBmYWxzZSwgdHJ1ZSk7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIHVwZGF0ZUFuZEluaXRpYWxpemVMb2NhbChzdG9yZWQ6IElBcHBTdG9yYWdlSXRlbSwgYXBwUGFja2FnZU9ySW5zdGFuY2U6IFByb3hpZWRBcHAgfCBCdWZmZXIpIHtcbiAgICAgICAgY29uc3QgYXBwID0gYXdhaXQgdGhpcy51cGRhdGVMb2NhbChzdG9yZWQsIGFwcFBhY2thZ2VPckluc3RhbmNlKTtcbiAgICAgICAgYXdhaXQgdGhpcy5pbml0aWFsaXplQXBwKHN0b3JlZCwgYXBwLCB0cnVlLCB0cnVlKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0TGFuZ3VhZ2VDb250ZW50KCk6IHsgW2tleTogc3RyaW5nXTogb2JqZWN0IH0ge1xuICAgICAgICBjb25zdCBsYW5nczogeyBba2V5OiBzdHJpbmddOiBvYmplY3QgfSA9IHt9O1xuXG4gICAgICAgIHRoaXMuYXBwcy5mb3JFYWNoKChybCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY29udGVudCA9IHJsLmdldFN0b3JhZ2VJdGVtKCkubGFuZ3VhZ2VDb250ZW50O1xuXG4gICAgICAgICAgICBPYmplY3Qua2V5cyhjb250ZW50KS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgICAgICAgICAgICBsYW5nc1trZXldID0gT2JqZWN0LmFzc2lnbihsYW5nc1trZXldIHx8IHt9LCBjb250ZW50W2tleV0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBsYW5ncztcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgY2hhbmdlU3RhdHVzKGFwcElkOiBzdHJpbmcsIHN0YXR1czogQXBwU3RhdHVzKTogUHJvbWlzZTxQcm94aWVkQXBwPiB7XG4gICAgICAgIHN3aXRjaCAoc3RhdHVzKSB7XG4gICAgICAgICAgICBjYXNlIEFwcFN0YXR1cy5NQU5VQUxMWV9ESVNBQkxFRDpcbiAgICAgICAgICAgIGNhc2UgQXBwU3RhdHVzLk1BTlVBTExZX0VOQUJMRUQ6XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBzdGF0dXMgdG8gY2hhbmdlIGFuIEFwcCB0bywgbXVzdCBiZSBtYW51YWxseSBkaXNhYmxlZCBvciBlbmFibGVkLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmwgPSB0aGlzLmFwcHMuZ2V0KGFwcElkKTtcblxuICAgICAgICBpZiAoIXJsKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NhbiBub3QgY2hhbmdlIHRoZSBzdGF0dXMgb2YgYW4gQXBwIHdoaWNoIGRvZXMgbm90IGN1cnJlbnRseSBleGlzdC4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChBcHBTdGF0dXNVdGlscy5pc0VuYWJsZWQoc3RhdHVzKSkge1xuICAgICAgICAgICAgLy8gVGhlbiBlbmFibGUgaXRcbiAgICAgICAgICAgIGlmIChBcHBTdGF0dXNVdGlscy5pc0VuYWJsZWQoYXdhaXQgcmwuZ2V0U3RhdHVzKCkpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW4gbm90IGVuYWJsZSBhbiBBcHAgd2hpY2ggaXMgYWxyZWFkeSBlbmFibGVkLicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmVuYWJsZShybC5nZXRJRCgpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICghQXBwU3RhdHVzVXRpbHMuaXNFbmFibGVkKGF3YWl0IHJsLmdldFN0YXR1cygpKSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2FuIG5vdCBkaXNhYmxlIGFuIEFwcCB3aGljaCBpcyBub3QgZW5hYmxlZC4nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXdhaXQgdGhpcy5kaXNhYmxlKHJsLmdldElEKCksIEFwcFN0YXR1cy5NQU5VQUxMWV9ESVNBQkxFRCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmw7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIHVwZGF0ZUFwcHNNYXJrZXRwbGFjZUluZm8oYXBwc092ZXJ2aWV3OiBBcnJheTx7IGxhdGVzdDogSU1hcmtldHBsYWNlSW5mbyB9Pik6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChcbiAgICAgICAgICAgIGFwcHNPdmVydmlldy5tYXAoYXN5bmMgKHsgbGF0ZXN0OiBhcHBJbmZvIH0pID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIWFwcEluZm8uc3Vic2NyaXB0aW9uSW5mbykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgYXBwID0gdGhpcy5hcHBzLmdldChhcHBJbmZvLmlkKTtcblxuICAgICAgICAgICAgICAgIGlmICghYXBwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBhcHBTdG9yYWdlSXRlbSA9IGFwcC5nZXRTdG9yYWdlSXRlbSgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgc3Vic2NyaXB0aW9uSW5mbyB9ID0gYXBwU3RvcmFnZUl0ZW0ubWFya2V0cGxhY2VJbmZvPy5bMF0gfHwge307XG5cbiAgICAgICAgICAgICAgICBpZiAoc3Vic2NyaXB0aW9uSW5mbyAmJiBzdWJzY3JpcHRpb25JbmZvLmxpY2Vuc2UubGljZW5zZSA9PT0gYXBwSW5mby5zdWJzY3JpcHRpb25JbmZvLmxpY2Vuc2UubGljZW5zZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgYXBwU3RvcmFnZUl0ZW0ubWFya2V0cGxhY2VJbmZvWzBdLnN1YnNjcmlwdGlvbkluZm8gPSBhcHBJbmZvLnN1YnNjcmlwdGlvbkluZm87XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5hcHBNZXRhZGF0YVN0b3JhZ2UudXBkYXRlKGFwcFN0b3JhZ2VJdGVtKTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICApLmNhdGNoKCk7XG5cbiAgICAgICAgY29uc3QgcXVldWUgPSBbXSBhcyBBcnJheTxQcm9taXNlPHZvaWQ+PjtcblxuICAgICAgICB0aGlzLmFwcHMuZm9yRWFjaCgoYXBwKSA9PlxuICAgICAgICAgICAgcXVldWUucHVzaChcbiAgICAgICAgICAgICAgICBhcHBcbiAgICAgICAgICAgICAgICAgICAgLnZhbGlkYXRlTGljZW5zZSgpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgoYXdhaXQgYXBwLmdldFN0YXR1cygpKSAhPT0gQXBwU3RhdHVzLklOVkFMSURfTElDRU5TRV9ESVNBQkxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFwcC5zZXRTdGF0dXMoQXBwU3RhdHVzLkRJU0FCTEVEKTtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgLmNhdGNoKGFzeW5jIChlcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEoZXJyb3IgaW5zdGFuY2VvZiBJbnZhbGlkTGljZW5zZUVycm9yKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wdXJnZUFwcENvbmZpZyhhcHApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXBwLnNldFN0YXR1cyhBcHBTdGF0dXMuSU5WQUxJRF9MSUNFTlNFX0RJU0FCTEVEKTtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RhdHVzID0gYXdhaXQgYXBwLmdldFN0YXR1cygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXR1cyA9PT0gYXBwLmdldFByZXZpb3VzU3RhdHVzKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHN0b3JhZ2VJdGVtID0gYXBwLmdldFN0b3JhZ2VJdGVtKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdG9yYWdlSXRlbS5zdGF0dXMgPSBzdGF0dXM7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmFwcE1ldGFkYXRhU3RvcmFnZS51cGRhdGUoc3RvcmFnZUl0ZW0pLmNhdGNoKGNvbnNvbGUuZXJyb3IpIGFzIFByb21pc2U8dm9pZD47XG4gICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgKSxcbiAgICAgICAgKTtcblxuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChxdWV1ZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR29lcyB0aHJvdWdoIHRoZSBlbnRpcmUgbG9hZGluZyB1cCBwcm9jZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGFwcElkIHRoZSBpZCBvZiB0aGUgYXBwbGljYXRpb24gdG8gbG9hZFxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBsb2FkT25lKGFwcElkOiBzdHJpbmcsIHNpbGVuY2VTdGF0dXMgPSBmYWxzZSk6IFByb21pc2U8UHJveGllZEFwcD4ge1xuICAgICAgICBjb25zdCBybCA9IHRoaXMuYXBwcy5nZXQoYXBwSWQpO1xuXG4gICAgICAgIGlmICghcmwpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gQXBwIGZvdW5kIGJ5IHRoZSBpZCBvZjogXCIke2FwcElkfVwiYCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpdGVtID0gcmwuZ2V0U3RvcmFnZUl0ZW0oKTtcblxuICAgICAgICBhd2FpdCB0aGlzLmluaXRpYWxpemVBcHAoaXRlbSwgcmwsIGZhbHNlLCBzaWxlbmNlU3RhdHVzKTtcblxuICAgICAgICBpZiAoIXRoaXMuYXJlUmVxdWlyZWRTZXR0aW5nc1NldChpdGVtKSkge1xuICAgICAgICAgICAgYXdhaXQgcmwuc2V0U3RhdHVzKEFwcFN0YXR1cy5JTlZBTElEX1NFVFRJTkdTX0RJU0FCTEVEKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghQXBwU3RhdHVzVXRpbHMuaXNEaXNhYmxlZChhd2FpdCBybC5nZXRTdGF0dXMoKSkgJiYgQXBwU3RhdHVzVXRpbHMuaXNFbmFibGVkKHJsLmdldFByZXZpb3VzU3RhdHVzKCkpKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmVuYWJsZUFwcChpdGVtLCBybCwgZmFsc2UsIHJsLmdldFByZXZpb3VzU3RhdHVzKCkgPT09IEFwcFN0YXR1cy5NQU5VQUxMWV9FTkFCTEVELCBzaWxlbmNlU3RhdHVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLmFwcHMuZ2V0KGl0ZW0uaWQpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgcnVuU3RhcnRVcFByb2Nlc3Moc3RvcmFnZUl0ZW06IElBcHBTdG9yYWdlSXRlbSwgYXBwOiBQcm94aWVkQXBwLCBpc01hbnVhbDogYm9vbGVhbiwgc2lsZW5jZVN0YXR1czogYm9vbGVhbik6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBpZiAoKGF3YWl0IGFwcC5nZXRTdGF0dXMoKSkgIT09IEFwcFN0YXR1cy5JTklUSUFMSVpFRCkge1xuICAgICAgICAgICAgY29uc3QgaXNJbml0aWFsaXplZCA9IGF3YWl0IHRoaXMuaW5pdGlhbGl6ZUFwcChzdG9yYWdlSXRlbSwgYXBwLCB0cnVlLCBzaWxlbmNlU3RhdHVzKTtcbiAgICAgICAgICAgIGlmICghaXNJbml0aWFsaXplZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5hcmVSZXF1aXJlZFNldHRpbmdzU2V0KHN0b3JhZ2VJdGVtKSkge1xuICAgICAgICAgICAgYXdhaXQgYXBwLnNldFN0YXR1cyhBcHBTdGF0dXMuSU5WQUxJRF9TRVRUSU5HU19ESVNBQkxFRCwgc2lsZW5jZVN0YXR1cyk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5lbmFibGVBcHAoc3RvcmFnZUl0ZW0sIGFwcCwgdHJ1ZSwgaXNNYW51YWwsIHNpbGVuY2VTdGF0dXMpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgaW5zdGFsbEFwcChfc3RvcmFnZUl0ZW06IElBcHBTdG9yYWdlSXRlbSwgYXBwOiBQcm94aWVkQXBwLCB1c2VyOiBJVXNlcik6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBsZXQgcmVzdWx0OiBib29sZWFuO1xuICAgICAgICBjb25zdCBjb250ZXh0ID0geyB1c2VyIH07XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IGFwcC5jYWxsKEFwcE1ldGhvZC5PTklOU1RBTEwsIGNvbnRleHQpO1xuXG4gICAgICAgICAgICByZXN1bHQgPSB0cnVlO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zdCBzdGF0dXMgPSBBcHBTdGF0dXMuRVJST1JfRElTQUJMRUQ7XG5cbiAgICAgICAgICAgIHJlc3VsdCA9IGZhbHNlO1xuXG4gICAgICAgICAgICBhd2FpdCBhcHAuc2V0U3RhdHVzKHN0YXR1cyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgdXBkYXRlQXBwKGFwcDogUHJveGllZEFwcCwgdXNlcjogSVVzZXIgfCBudWxsLCBvbGRBcHBWZXJzaW9uOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgbGV0IHJlc3VsdDogYm9vbGVhbjtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgYXBwLmNhbGwoQXBwTWV0aG9kLk9OVVBEQVRFLCB7IG9sZEFwcFZlcnNpb24sIHVzZXIgfSk7XG5cbiAgICAgICAgICAgIHJlc3VsdCA9IHRydWU7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnN0IHN0YXR1cyA9IEFwcFN0YXR1cy5FUlJPUl9ESVNBQkxFRDtcblxuICAgICAgICAgICAgcmVzdWx0ID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGF3YWl0IGFwcC5zZXRTdGF0dXMoc3RhdHVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBpbml0aWFsaXplQXBwKHN0b3JhZ2VJdGVtOiBJQXBwU3RvcmFnZUl0ZW0sIGFwcDogUHJveGllZEFwcCwgc2F2ZVRvRGIgPSB0cnVlLCBzaWxlbmNlU3RhdHVzID0gZmFsc2UpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgbGV0IHJlc3VsdDogYm9vbGVhbjtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgYXBwLnZhbGlkYXRlTGljZW5zZSgpO1xuICAgICAgICAgICAgYXdhaXQgYXBwLnZhbGlkYXRlSW5zdGFsbGF0aW9uKCk7XG5cbiAgICAgICAgICAgIGF3YWl0IGFwcC5jYWxsKEFwcE1ldGhvZC5JTklUSUFMSVpFKTtcbiAgICAgICAgICAgIGF3YWl0IGFwcC5zZXRTdGF0dXMoQXBwU3RhdHVzLklOSVRJQUxJWkVELCBzaWxlbmNlU3RhdHVzKTtcblxuICAgICAgICAgICAgcmVzdWx0ID0gdHJ1ZTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgbGV0IHN0YXR1cyA9IEFwcFN0YXR1cy5FUlJPUl9ESVNBQkxFRDtcblxuICAgICAgICAgICAgaWYgKGUgaW5zdGFuY2VvZiBJbnZhbGlkTGljZW5zZUVycm9yKSB7XG4gICAgICAgICAgICAgICAgc3RhdHVzID0gQXBwU3RhdHVzLklOVkFMSURfTElDRU5TRV9ESVNBQkxFRDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGUgaW5zdGFuY2VvZiBJbnZhbGlkSW5zdGFsbGF0aW9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgICBzdGF0dXMgPSBBcHBTdGF0dXMuSU5WQUxJRF9JTlNUQUxMQVRJT05fRElTQUJMRUQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGF3YWl0IHRoaXMucHVyZ2VBcHBDb25maWcoYXBwKTtcbiAgICAgICAgICAgIHJlc3VsdCA9IGZhbHNlO1xuXG4gICAgICAgICAgICBhd2FpdCBhcHAuc2V0U3RhdHVzKHN0YXR1cywgc2lsZW5jZVN0YXR1cyk7XG5cbiAgICAgICAgICAgIC8vIElmIHNvbWUgZXJyb3IgaGFzIGhhcHBlbmVkIGluIGluaXRpYWxpemF0aW9uLCBsaWtlIGxpY2Vuc2Ugb3IgaW5zdGFsbGF0aW9ucyBpbnZhbGlkYXRpb25cbiAgICAgICAgICAgIC8vIHdlIG5lZWQgdG8gc3RvcmUgdGhpcyBvbiB0aGUgREIgcmVnYXJkbGVzcyBvZiB3aGF0IHRoZSBwYXJhbWV0ZXIgcmVxdWVzdHNcbiAgICAgICAgICAgIHNhdmVUb0RiID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzYXZlVG9EYikge1xuICAgICAgICAgICAgLy8gVGhpcyBpcyBhc3luYywgYnV0IHdlIGRvbid0IGNhcmUgc2luY2UgaXQgb25seSB1cGRhdGVzIGluIHRoZSBkYXRhYmFzZVxuICAgICAgICAgICAgLy8gYW5kIGl0IHNob3VsZCBub3QgbXV0YXRlIGFueSBwcm9wZXJ0aWVzIHdlIGNhcmUgYWJvdXRcbiAgICAgICAgICAgIHN0b3JhZ2VJdGVtLnN0YXR1cyA9IGF3YWl0IGFwcC5nZXRTdGF0dXMoKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuYXBwTWV0YWRhdGFTdG9yYWdlLnVwZGF0ZShzdG9yYWdlSXRlbSkuY2F0Y2goKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBwdXJnZUFwcENvbmZpZyhhcHA6IFByb3hpZWRBcHAsIG9wdHM6IElQdXJnZUFwcENvbmZpZ09wdHMgPSB7fSkge1xuICAgICAgICBpZiAoIW9wdHMua2VlcFNjaGVkdWxlZEpvYnMpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuc2NoZWR1bGVyTWFuYWdlci5jbGVhblVwKGFwcC5nZXRJRCgpKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxpc3RlbmVyTWFuYWdlci51bnJlZ2lzdGVyTGlzdGVuZXJzKGFwcCk7XG4gICAgICAgIHRoaXMubGlzdGVuZXJNYW5hZ2VyLmxvY2tFc3NlbnRpYWxFdmVudHMoYXBwKTtcbiAgICAgICAgYXdhaXQgdGhpcy5jb21tYW5kTWFuYWdlci51bnJlZ2lzdGVyQ29tbWFuZHMoYXBwLmdldElEKCkpO1xuICAgICAgICB0aGlzLmV4dGVybmFsQ29tcG9uZW50TWFuYWdlci51bnJlZ2lzdGVyRXh0ZXJuYWxDb21wb25lbnRzKGFwcC5nZXRJRCgpKTtcbiAgICAgICAgYXdhaXQgdGhpcy5hcGlNYW5hZ2VyLnVucmVnaXN0ZXJBcGlzKGFwcC5nZXRJRCgpKTtcbiAgICAgICAgdGhpcy5hY2Nlc3Nvck1hbmFnZXIucHVyaWZ5QXBwKGFwcC5nZXRJRCgpKTtcbiAgICAgICAgdGhpcy51aUFjdGlvbkJ1dHRvbk1hbmFnZXIuY2xlYXJBcHBBY3Rpb25CdXR0b25zKGFwcC5nZXRJRCgpKTtcbiAgICAgICAgdGhpcy52aWRlb0NvbmZQcm92aWRlck1hbmFnZXIudW5yZWdpc3RlclByb3ZpZGVycyhhcHAuZ2V0SUQoKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGV0ZXJtaW5lcyBpZiB0aGUgQXBwJ3MgcmVxdWlyZWQgc2V0dGluZ3MgYXJlIHNldCBvciBub3QuXG4gICAgICogU2hvdWxkIGEgcGFja2FnZVZhbHVlIGJlIHByb3ZpZGVkIGFuZCBub3QgZW1wdHksIHRoZW4gaXQncyBjb25zaWRlcmVkIHNldC5cbiAgICAgKi9cbiAgICBwcml2YXRlIGFyZVJlcXVpcmVkU2V0dGluZ3NTZXQoc3RvcmFnZUl0ZW06IElBcHBTdG9yYWdlSXRlbSk6IGJvb2xlYW4ge1xuICAgICAgICBsZXQgcmVzdWx0ID0gdHJ1ZTtcblxuICAgICAgICBmb3IgKGNvbnN0IHNldGsgb2YgT2JqZWN0LmtleXMoc3RvcmFnZUl0ZW0uc2V0dGluZ3MpKSB7XG4gICAgICAgICAgICBjb25zdCBzZXR0ID0gc3RvcmFnZUl0ZW0uc2V0dGluZ3Nbc2V0a107XG4gICAgICAgICAgICAvLyBJZiBpdCdzIG5vdCByZXF1aXJlZCwgaWdub3JlXG4gICAgICAgICAgICBpZiAoIXNldHQucmVxdWlyZWQpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHNldHQudmFsdWUgIT09ICd1bmRlZmluZWQnIHx8IHNldHQucGFja2FnZVZhbHVlICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXN1bHQgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBlbmFibGVBcHAoc3RvcmFnZUl0ZW06IElBcHBTdG9yYWdlSXRlbSwgYXBwOiBQcm94aWVkQXBwLCBzYXZlVG9EYiA9IHRydWUsIGlzTWFudWFsOiBib29sZWFuLCBzaWxlbmNlU3RhdHVzID0gZmFsc2UpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgbGV0IGVuYWJsZTogYm9vbGVhbjtcbiAgICAgICAgbGV0IHN0YXR1cyA9IEFwcFN0YXR1cy5FUlJPUl9ESVNBQkxFRDtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgYXBwLnZhbGlkYXRlTGljZW5zZSgpO1xuICAgICAgICAgICAgYXdhaXQgYXBwLnZhbGlkYXRlSW5zdGFsbGF0aW9uKCk7XG5cbiAgICAgICAgICAgIGVuYWJsZSA9IChhd2FpdCBhcHAuY2FsbChBcHBNZXRob2QuT05FTkFCTEUpKSBhcyBib29sZWFuO1xuXG4gICAgICAgICAgICBpZiAoZW5hYmxlKSB7XG4gICAgICAgICAgICAgICAgc3RhdHVzID0gaXNNYW51YWwgPyBBcHBTdGF0dXMuTUFOVUFMTFlfRU5BQkxFRCA6IEFwcFN0YXR1cy5BVVRPX0VOQUJMRUQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHN0YXR1cyA9IEFwcFN0YXR1cy5ESVNBQkxFRDtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFRoZSBBcHAgKCR7YXBwLmdldElEKCl9KSBkaXNhYmxlZCBpdHNlbGYgd2hlbiBiZWluZyBlbmFibGVkLiBcXG5DaGVjayB0aGUgXCJvbkVuYWJsZVwiIGltcGxlbWVudGF0aW9uIGZvciBkZXRhaWxzLmApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBlbmFibGUgPSBmYWxzZTtcblxuICAgICAgICAgICAgaWYgKGUgaW5zdGFuY2VvZiBJbnZhbGlkTGljZW5zZUVycm9yKSB7XG4gICAgICAgICAgICAgICAgc3RhdHVzID0gQXBwU3RhdHVzLklOVkFMSURfTElDRU5TRV9ESVNBQkxFRDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGUgaW5zdGFuY2VvZiBJbnZhbGlkSW5zdGFsbGF0aW9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgICBzdGF0dXMgPSBBcHBTdGF0dXMuSU5WQUxJRF9JTlNUQUxMQVRJT05fRElTQUJMRUQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG5cbiAgICAgICAgICAgIC8vIElmIHNvbWUgZXJyb3IgaGFzIGhhcHBlbmVkIGR1cmluZyBlbmFibGluZywgbGlrZSBsaWNlbnNlIG9yIGluc3RhbGxhdGlvbnMgaW52YWxpZGF0aW9uXG4gICAgICAgICAgICAvLyB3ZSBuZWVkIHRvIHN0b3JlIHRoaXMgb24gdGhlIERCIHJlZ2FyZGxlc3Mgb2Ygd2hhdCB0aGUgcGFyYW1ldGVyIHJlcXVlc3RzXG4gICAgICAgICAgICBzYXZlVG9EYiA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZW5hYmxlKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNvbW1hbmRNYW5hZ2VyLnJlZ2lzdGVyQ29tbWFuZHMoYXBwLmdldElEKCkpO1xuICAgICAgICAgICAgdGhpcy5leHRlcm5hbENvbXBvbmVudE1hbmFnZXIucmVnaXN0ZXJFeHRlcm5hbENvbXBvbmVudHMoYXBwLmdldElEKCkpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5hcGlNYW5hZ2VyLnJlZ2lzdGVyQXBpcyhhcHAuZ2V0SUQoKSk7XG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVyTWFuYWdlci5yZWdpc3Rlckxpc3RlbmVycyhhcHApO1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5lck1hbmFnZXIucmVsZWFzZUVzc2VudGlhbEV2ZW50cyhhcHApO1xuICAgICAgICAgICAgdGhpcy52aWRlb0NvbmZQcm92aWRlck1hbmFnZXIucmVnaXN0ZXJQcm92aWRlcnMoYXBwLmdldElEKCkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wdXJnZUFwcENvbmZpZyhhcHApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNhdmVUb0RiKSB7XG4gICAgICAgICAgICBzdG9yYWdlSXRlbS5zdGF0dXMgPSBzdGF0dXM7XG4gICAgICAgICAgICAvLyBUaGlzIGlzIGFzeW5jLCBidXQgd2UgZG9uJ3QgY2FyZSBzaW5jZSBpdCBvbmx5IHVwZGF0ZXMgaW4gdGhlIGRhdGFiYXNlXG4gICAgICAgICAgICAvLyBhbmQgaXQgc2hvdWxkIG5vdCBtdXRhdGUgYW55IHByb3BlcnRpZXMgd2UgY2FyZSBhYm91dFxuICAgICAgICAgICAgYXdhaXQgdGhpcy5hcHBNZXRhZGF0YVN0b3JhZ2UudXBkYXRlKHN0b3JhZ2VJdGVtKS5jYXRjaCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgYXBwLnNldFN0YXR1cyhzdGF0dXMsIHNpbGVuY2VTdGF0dXMpO1xuXG4gICAgICAgIHJldHVybiBlbmFibGU7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBjcmVhdGVBcHBVc2VyKGFwcEluZm86IElBcHBJbmZvKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAgICAgY29uc3QgYXBwVXNlciA9IGF3YWl0ICh0aGlzLmJyaWRnZXMuZ2V0VXNlckJyaWRnZSgpIGFzIElJbnRlcm5hbFVzZXJCcmlkZ2UgJiBVc2VyQnJpZGdlKS5nZXRBcHBVc2VyKGFwcEluZm8uaWQpO1xuXG4gICAgICAgIGlmIChhcHBVc2VyKSB7XG4gICAgICAgICAgICByZXR1cm4gYXBwVXNlci5pZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHVzZXJEYXRhOiBQYXJ0aWFsPElVc2VyPiA9IHtcbiAgICAgICAgICAgIHVzZXJuYW1lOiBgJHthcHBJbmZvLm5hbWVTbHVnfS5ib3RgLFxuICAgICAgICAgICAgbmFtZTogYXBwSW5mby5uYW1lLFxuICAgICAgICAgICAgcm9sZXM6IFsnYXBwJ10sXG4gICAgICAgICAgICBhcHBJZDogYXBwSW5mby5pZCxcbiAgICAgICAgICAgIHR5cGU6IFVzZXJUeXBlLkFQUCxcbiAgICAgICAgICAgIHN0YXR1czogJ29ubGluZScsXG4gICAgICAgICAgICBpc0VuYWJsZWQ6IHRydWUsXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuICh0aGlzLmJyaWRnZXMuZ2V0VXNlckJyaWRnZSgpIGFzIElJbnRlcm5hbFVzZXJCcmlkZ2UgJiBVc2VyQnJpZGdlKS5jcmVhdGUodXNlckRhdGEsIGFwcEluZm8uaWQsIHtcbiAgICAgICAgICAgIGF2YXRhclVybDogYXBwSW5mby5pY29uRmlsZUNvbnRlbnQgfHwgYXBwSW5mby5pY29uRmlsZSxcbiAgICAgICAgICAgIGpvaW5EZWZhdWx0Q2hhbm5lbHM6IHRydWUsXG4gICAgICAgICAgICBzZW5kV2VsY29tZUVtYWlsOiBmYWxzZSxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyByZW1vdmVBcHBVc2VyKGFwcDogUHJveGllZEFwcCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBjb25zdCBhcHBVc2VyID0gYXdhaXQgKHRoaXMuYnJpZGdlcy5nZXRVc2VyQnJpZGdlKCkgYXMgSUludGVybmFsVXNlckJyaWRnZSAmIFVzZXJCcmlkZ2UpLmdldEFwcFVzZXIoYXBwLmdldElEKCkpO1xuXG4gICAgICAgIGlmICghYXBwVXNlcikge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gKHRoaXMuYnJpZGdlcy5nZXRVc2VyQnJpZGdlKCkgYXMgSUludGVybmFsVXNlckJyaWRnZSAmIFVzZXJCcmlkZ2UpLnJlbW92ZShhcHBVc2VyLCBhcHAuZ2V0SUQoKSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyB1bmluc3RhbGxBcHAoYXBwOiBQcm94aWVkQXBwLCB1c2VyOiBJVXNlcik6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBsZXQgcmVzdWx0OiBib29sZWFuO1xuICAgICAgICBjb25zdCBjb250ZXh0ID0geyB1c2VyIH07XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IGFwcC5jYWxsKEFwcE1ldGhvZC5PTlVOSU5TVEFMTCwgY29udGV4dCk7XG5cbiAgICAgICAgICAgIHJlc3VsdCA9IHRydWU7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnN0IHN0YXR1cyA9IEFwcFN0YXR1cy5FUlJPUl9ESVNBQkxFRDtcblxuICAgICAgICAgICAgcmVzdWx0ID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGF3YWl0IGFwcC5zZXRTdGF0dXMoc3RhdHVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxufVxuXG5leHBvcnQgY29uc3QgZ2V0UGVybWlzc2lvbnNCeUFwcElkID0gKGFwcElkOiBzdHJpbmcpID0+IHtcbiAgICBpZiAoIUFwcE1hbmFnZXIuSW5zdGFuY2UpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignQXBwTWFuYWdlciBzaG91bGQgYmUgaW5zdGFudGlhdGVkIGZpcnN0Jyk7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgcmV0dXJuIEFwcE1hbmFnZXIuSW5zdGFuY2UuZ2V0UGVybWlzc2lvbnNCeUlkKGFwcElkKTtcbn07XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxNQUFNLFFBQVEsU0FBUztBQUdoQyxTQUFTLFVBQVUsUUFBUSxlQUFlO0FBRTFDLFNBQVMsVUFBVSxRQUFRLFlBQVk7QUFDdkMsU0FBUyxTQUFTLEVBQUUsY0FBYyxRQUFRLDBCQUEwQjtBQUVwRSxTQUFTLFNBQVMsUUFBUSx5QkFBeUI7QUFHbkQsU0FBUyxRQUFRLFFBQVEsc0JBQXNCO0FBRy9D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