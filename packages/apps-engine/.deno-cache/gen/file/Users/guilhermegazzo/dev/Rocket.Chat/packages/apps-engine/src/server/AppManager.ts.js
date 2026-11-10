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
import { AppOutboundCommunicationProviderManager } from './managers/AppOutboundCommunicationProviderManager';
import { AppRuntimeManager } from './managers/AppRuntimeManager';
import { AppSignatureManager } from './managers/AppSignatureManager';
import { UIActionButtonManager } from './managers/UIActionButtonManager';
import { defaultPermissions } from './permissions/AppPermissions';
import { EmptyRuntime } from './runtime/EmptyRuntime';
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
  outboundCommunicationProviderManager;
  signatureManager;
  runtime;
  tempFilePath;
  isLoaded;
  constructor({ metadataStorage, logStorage, bridges, sourceStorage, tempFilePath }){
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
    this.tempFilePath = tempFilePath;
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
    this.outboundCommunicationProviderManager = new AppOutboundCommunicationProviderManager(this);
    this.signatureManager = new AppSignatureManager(this);
    this.runtime = new AppRuntimeManager(this);
    this.isLoaded = false;
    AppManager.Instance = this;
  }
  /**
	 * Gets the path to the temporary file storage.
	 *
	 * Mainly used for upload events
	 */ getTempFilePath() {
    return this.tempFilePath;
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
  getOutboundCommunicationProviderManager() {
    return this.outboundCommunicationProviderManager;
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
        const prl = new ProxiedApp(this, item, new EmptyRuntime(item.id));
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
      await this.initializeApp(rl, true).catch(console.error);
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
        await this.enableApp(app).catch(console.error);
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
      void app.getRuntimeController().stopApp();
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
    const isSetup = await this.runStartUpProcess(storageItem, rl, false);
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
      keepScheduledJobs: true,
      keepSlashcommands: true,
      keepOutboundCommunicationProviders: true
    });
    await app.setStatus(status, silent);
    const storageItem = await this.appMetadataStorage.retrieveOne(id);
    app.getStorageItem().marketplaceInfo = storageItem.marketplaceInfo;
    await app.validateLicense().catch(()=>{});
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
    await app.validateLicense().catch(()=>{});
    storageItem.migrated = true;
    storageItem.signature = await this.getSignatureManager().signApp(storageItem);
    const { marketplaceInfo, signature, migrated, _id } = storageItem;
    const stored = await this.appMetadataStorage.updatePartialAndReturnDocument({
      marketplaceInfo,
      signature,
      migrated,
      _id
    });
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
      status: enable ? AppStatus.MANUALLY_ENABLED : AppStatus.MANUALLY_DISABLED,
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
    } catch  {
      aff.setStorageError('Failed to store app package');
      return aff;
    }
    let app;
    try {
      app = await this.getCompiler().toSandBox(this, descriptor, result);
    } catch (error) {
      await Promise.all(undoSteps.map((undoer)=>undoer()));
      throw error;
    }
    undoSteps.push(()=>this.getRuntime().stopRuntime(app.getRuntimeController()).catch(()=>{}));
    // Create a user for the app
    try {
      await this.createAppUser(result.info);
      undoSteps.push(async ()=>void this.removeAppUser(app));
    } catch  {
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
    app.getStorageItem()._id = created._id;
    this.apps.set(app.getID(), app);
    aff.setApp(app);
    // Let everyone know that the App has been added
    await this.bridges.getAppActivationBridge().doAppAdded(app).catch(()=>{
    // If an error occurs during this, oh well.
    });
    await this.installApp(app, user);
    // Should enable === true, then we go through the entire start up process
    // Otherwise, we only initialize it.
    if (enable) {
      // Start up the app
      await this.runStartUpProcess(created, app, false);
    } else {
      await this.initializeApp(app);
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
    await this.getRuntime().stopRuntime(app.getRuntimeController()).catch(()=>{});
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
      id: result.info.id,
      info: result.info,
      languageContent: result.languageContent,
      implemented: result.implemented.getValues()
    };
    if (!permissionsGranted) {
      delete descriptor.permissionsGranted;
    } else {
      descriptor.permissionsGranted = permissionsGranted;
    }
    try {
      descriptor.sourcePath = await this.appSourceStorage.update(descriptor, appPackage);
    } catch  {
      aff.setStorageError('Failed to storage app package');
      return aff;
    }
    descriptor.signature = await this.signatureManager.signApp(descriptor);
    const stored = await this.appMetadataStorage.updatePartialAndReturnDocument(descriptor, {
      unsetPermissionsGranted: typeof permissionsGranted === 'undefined'
    });
    // Errors here don't really prevent the process from dying, so we don't really need to do anything on the catch
    await this.getRuntime().stopRuntime(this.apps.get(old.id).getRuntimeController()).catch(()=>{});
    const app = await this.getCompiler().toSandBox(this, descriptor, result);
    // Ensure there is an user for the app
    try {
      await this.createAppUser(result.info);
    } catch  {
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
        await this.getRuntime().stopRuntime(this.apps.get(stored.id).getRuntimeController()).catch(()=>{});
        return this.getCompiler().toSandBox(this, stored, parseResult);
      }
      if (appPackageOrInstance instanceof ProxiedApp) {
        return appPackageOrInstance;
      }
    })();
    // We don't keep slashcommands here as the update could potentially not provide the same list
    await this.purgeAppConfig(app, {
      keepScheduledJobs: true
    });
    this.apps.set(app.getID(), app);
    return app;
  }
  async updateAndStartupLocal(stored, appPackageOrInstance) {
    const app = await this.updateLocal(stored, appPackageOrInstance);
    await this.runStartUpProcess(stored, app, true);
  }
  async updateAndInitializeLocal(stored, appPackageOrInstance) {
    const app = await this.updateLocal(stored, appPackageOrInstance);
    await this.initializeApp(app, true);
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
    const storageItem = rl.getStorageItem();
    if (AppStatusUtils.isEnabled(status)) {
      // Then enable it
      if (AppStatusUtils.isEnabled(await rl.getStatus())) {
        throw new Error('Can not enable an App which is already enabled.');
      }
      await this.enable(rl.getID());
      storageItem.status = AppStatus.MANUALLY_ENABLED;
      await this.appMetadataStorage.updateStatus(storageItem._id, AppStatus.MANUALLY_ENABLED);
    } else {
      if (!AppStatusUtils.isEnabled(await rl.getStatus())) {
        throw new Error('Can not disable an App which is not enabled.');
      }
      await this.disable(rl.getID(), AppStatus.MANUALLY_DISABLED);
      storageItem.status = AppStatus.MANUALLY_DISABLED;
      await this.appMetadataStorage.updateStatus(storageItem._id, AppStatus.MANUALLY_DISABLED);
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
      if (subscriptionInfo?.license.license === appInfo.subscriptionInfo.license.license) {
        return;
      }
      appStorageItem.marketplaceInfo[0].subscriptionInfo = appInfo.subscriptionInfo;
      appStorageItem.signature = await this.getSignatureManager().signApp(appStorageItem);
      return this.appMetadataStorage.updatePartialAndReturnDocument({
        _id: appStorageItem._id,
        marketplaceInfo: appStorageItem.marketplaceInfo,
        signature: appStorageItem.signature
      });
    })).catch(()=>{});
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
        await this.purgeAppConfig(app, {
          keepScheduledJobs: true
        });
        return app.setStatus(AppStatus.INVALID_LICENSE_DISABLED);
      }).then(async ()=>{
        const status = await app.getStatus();
        if (status === app.getPreviousStatus()) {
          return;
        }
        const storageItem = app.getStorageItem();
        storageItem.status = status;
        return this.appMetadataStorage.updateStatus(storageItem._id, storageItem.status).catch(console.error);
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
    await this.initializeApp(rl, silenceStatus);
    if (!this.areRequiredSettingsSet(item)) {
      await rl.setStatus(AppStatus.INVALID_SETTINGS_DISABLED);
    }
    if (!AppStatusUtils.isDisabled(await rl.getStatus()) && AppStatusUtils.isEnabled(rl.getPreviousStatus())) {
      await this.enableApp(rl, silenceStatus);
    }
    return this.apps.get(item.id);
  }
  async runStartUpProcess(storageItem, app, silenceStatus) {
    if (await app.getStatus() !== AppStatus.INITIALIZED) {
      const isInitialized = await this.initializeApp(app, silenceStatus);
      if (!isInitialized) {
        return false;
      }
    }
    if (!this.areRequiredSettingsSet(storageItem)) {
      await app.setStatus(AppStatus.INVALID_SETTINGS_DISABLED, silenceStatus);
      return false;
    }
    return this.enableApp(app, silenceStatus);
  }
  async installApp(app, user) {
    let result;
    const context = {
      user
    };
    try {
      await app.call(AppMethod.ONINSTALL, context);
      result = true;
    } catch  {
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
    } catch  {
      const status = AppStatus.ERROR_DISABLED;
      result = false;
      await app.setStatus(status);
    }
    return result;
  }
  async initializeApp(app, silenceStatus = false) {
    let result;
    try {
      await app.validateLicense();
      await app.validateInstallation();
      await app.call(AppMethod.INITIALIZE);
      await app.setStatus(AppStatus.INITIALIZED, silenceStatus);
      await this.commandManager.registerCommands(app.getID());
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
    return result;
  }
  async purgeAppConfig(app, opts = {}) {
    if (!opts.keepScheduledJobs) {
      await this.schedulerManager.cleanUp(app.getID());
    }
    if (!opts.keepSlashcommands) {
      await this.commandManager.unregisterCommands(app.getID());
    }
    this.listenerManager.unregisterListeners(app);
    this.listenerManager.lockEssentialEvents(app);
    this.externalComponentManager.unregisterExternalComponents(app.getID());
    await this.apiManager.unregisterApis(app.getID());
    this.accessorManager.purifyApp(app.getID());
    this.uiActionButtonManager.clearAppActionButtons(app.getID());
    await this.videoConfProviderManager.unregisterProviders(app.getID());
    await this.outboundCommunicationProviderManager.unregisterProviders(app.getID(), {
      keepReferences: opts.keepOutboundCommunicationProviders
    });
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
  async enableApp(app, silenceStatus = false) {
    let enable;
    let status = AppStatus.ERROR_DISABLED;
    try {
      await app.validateLicense();
      await app.validateInstallation();
      enable = await app.call(AppMethod.ONENABLE);
      if (enable) {
        status = AppStatus.MANUALLY_ENABLED;
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
      this.externalComponentManager.registerExternalComponents(app.getID());
      await this.apiManager.registerApis(app.getID());
      this.listenerManager.registerListeners(app);
      this.listenerManager.releaseEssentialEvents(app);
      await this.videoConfProviderManager.registerProviders(app.getID());
      await this.outboundCommunicationProviderManager.registerProviders(app.getID());
    } else {
      await this.purgeAppConfig(app, {
        keepScheduledJobs: true,
        keepSlashcommands: true,
        keepOutboundCommunicationProviders: true
      });
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
    } catch  {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvZ3VpbGhlcm1lZ2F6em8vZGV2L1JvY2tldC5DaGF0L3BhY2thZ2VzL2FwcHMtZW5naW5lL3NyYy9zZXJ2ZXIvQXBwTWFuYWdlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBCdWZmZXIgfSBmcm9tICdidWZmZXInO1xuXG5pbXBvcnQgdHlwZSB7IElHZXRBcHBzRmlsdGVyIH0gZnJvbSAnLi9JR2V0QXBwc0ZpbHRlcic7XG5pbXBvcnQgeyBQcm94aWVkQXBwIH0gZnJvbSAnLi9Qcm94aWVkQXBwJztcbmltcG9ydCB0eXBlIHsgUGVyc2lzdGVuY2VCcmlkZ2UsIFVzZXJCcmlkZ2UgfSBmcm9tICcuL2JyaWRnZXMnO1xuaW1wb3J0IHsgQXBwQnJpZGdlcyB9IGZyb20gJy4vYnJpZGdlcyc7XG5pbXBvcnQgeyBBcHBTdGF0dXMsIEFwcFN0YXR1c1V0aWxzIH0gZnJvbSAnLi4vZGVmaW5pdGlvbi9BcHBTdGF0dXMnO1xuaW1wb3J0IHR5cGUgeyBJQXBwSW5mbyB9IGZyb20gJy4uL2RlZmluaXRpb24vbWV0YWRhdGEnO1xuaW1wb3J0IHsgQXBwTWV0aG9kIH0gZnJvbSAnLi4vZGVmaW5pdGlvbi9tZXRhZGF0YSc7XG5pbXBvcnQgdHlwZSB7IElQZXJtaXNzaW9uIH0gZnJvbSAnLi4vZGVmaW5pdGlvbi9wZXJtaXNzaW9ucy9JUGVybWlzc2lvbic7XG5pbXBvcnQgdHlwZSB7IElVc2VyIH0gZnJvbSAnLi4vZGVmaW5pdGlvbi91c2Vycyc7XG5pbXBvcnQgeyBVc2VyVHlwZSB9IGZyb20gJy4uL2RlZmluaXRpb24vdXNlcnMnO1xuaW1wb3J0IHR5cGUgeyBJSW50ZXJuYWxQZXJzaXN0ZW5jZUJyaWRnZSB9IGZyb20gJy4vYnJpZGdlcy9JSW50ZXJuYWxQZXJzaXN0ZW5jZUJyaWRnZSc7XG5pbXBvcnQgdHlwZSB7IElJbnRlcm5hbFVzZXJCcmlkZ2UgfSBmcm9tICcuL2JyaWRnZXMvSUludGVybmFsVXNlckJyaWRnZSc7XG5pbXBvcnQgeyBBcHBDb21waWxlciwgQXBwRmFicmljYXRpb25GdWxmaWxsbWVudCwgQXBwUGFja2FnZVBhcnNlciB9IGZyb20gJy4vY29tcGlsZXInO1xuaW1wb3J0IHsgSW52YWxpZExpY2Vuc2VFcnJvciB9IGZyb20gJy4vZXJyb3JzJztcbmltcG9ydCB7IEludmFsaWRJbnN0YWxsYXRpb25FcnJvciB9IGZyb20gJy4vZXJyb3JzL0ludmFsaWRJbnN0YWxsYXRpb25FcnJvcic7XG5pbXBvcnQge1xuXHRBcHBBY2Nlc3Nvck1hbmFnZXIsXG5cdEFwcEFwaU1hbmFnZXIsXG5cdEFwcEV4dGVybmFsQ29tcG9uZW50TWFuYWdlcixcblx0QXBwTGljZW5zZU1hbmFnZXIsXG5cdEFwcExpc3RlbmVyTWFuYWdlcixcblx0QXBwU2NoZWR1bGVyTWFuYWdlcixcblx0QXBwU2V0dGluZ3NNYW5hZ2VyLFxuXHRBcHBTbGFzaENvbW1hbmRNYW5hZ2VyLFxuXHRBcHBWaWRlb0NvbmZQcm92aWRlck1hbmFnZXIsXG59IGZyb20gJy4vbWFuYWdlcnMnO1xuaW1wb3J0IHsgQXBwT3V0Ym91bmRDb21tdW5pY2F0aW9uUHJvdmlkZXJNYW5hZ2VyIH0gZnJvbSAnLi9tYW5hZ2Vycy9BcHBPdXRib3VuZENvbW11bmljYXRpb25Qcm92aWRlck1hbmFnZXInO1xuaW1wb3J0IHsgQXBwUnVudGltZU1hbmFnZXIgfSBmcm9tICcuL21hbmFnZXJzL0FwcFJ1bnRpbWVNYW5hZ2VyJztcbmltcG9ydCB7IEFwcFNpZ25hdHVyZU1hbmFnZXIgfSBmcm9tICcuL21hbmFnZXJzL0FwcFNpZ25hdHVyZU1hbmFnZXInO1xuaW1wb3J0IHsgVUlBY3Rpb25CdXR0b25NYW5hZ2VyIH0gZnJvbSAnLi9tYW5hZ2Vycy9VSUFjdGlvbkJ1dHRvbk1hbmFnZXInO1xuaW1wb3J0IHR5cGUgeyBJTWFya2V0cGxhY2VJbmZvIH0gZnJvbSAnLi9tYXJrZXRwbGFjZSc7XG5pbXBvcnQgeyBkZWZhdWx0UGVybWlzc2lvbnMgfSBmcm9tICcuL3Blcm1pc3Npb25zL0FwcFBlcm1pc3Npb25zJztcbmltcG9ydCB7IEVtcHR5UnVudGltZSB9IGZyb20gJy4vcnVudGltZS9FbXB0eVJ1bnRpbWUnO1xuaW1wb3J0IHR5cGUgeyBJQXBwU3RvcmFnZUl0ZW0gfSBmcm9tICcuL3N0b3JhZ2UnO1xuaW1wb3J0IHsgQXBwTG9nU3RvcmFnZSwgQXBwTWV0YWRhdGFTdG9yYWdlIH0gZnJvbSAnLi9zdG9yYWdlJztcbmltcG9ydCB7IEFwcFNvdXJjZVN0b3JhZ2UgfSBmcm9tICcuL3N0b3JhZ2UvQXBwU291cmNlU3RvcmFnZSc7XG5pbXBvcnQgeyBBcHBJbnN0YWxsYXRpb25Tb3VyY2UgfSBmcm9tICcuL3N0b3JhZ2UvSUFwcFN0b3JhZ2VJdGVtJztcblxuZXhwb3J0IGludGVyZmFjZSBJQXBwSW5zdGFsbFBhcmFtZXRlcnMge1xuXHRlbmFibGU6IGJvb2xlYW47XG5cdG1hcmtldHBsYWNlSW5mbz86IElNYXJrZXRwbGFjZUluZm9bXTtcblx0cGVybWlzc2lvbnNHcmFudGVkPzogQXJyYXk8SVBlcm1pc3Npb24+O1xuXHR1c2VyOiBJVXNlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJQXBwVW5pbnN0YWxsUGFyYW1ldGVycyB7XG5cdHVzZXI6IElVc2VyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElBcHBNYW5hZ2VyRGVwcyB7XG5cdG1ldGFkYXRhU3RvcmFnZTogQXBwTWV0YWRhdGFTdG9yYWdlO1xuXHRsb2dTdG9yYWdlOiBBcHBMb2dTdG9yYWdlO1xuXHRicmlkZ2VzOiBBcHBCcmlkZ2VzO1xuXHRzb3VyY2VTdG9yYWdlOiBBcHBTb3VyY2VTdG9yYWdlO1xuXHQvKipcblx0ICogUGF0aCB0byB0ZW1wb3JhcnkgZmlsZSBzdG9yYWdlLlxuXHQgKlxuXHQgKiBOZWVkcyB0byBiZSBhY2Nlc3NpYmxlIGZvciByZWFkaW5nIGFuZCB3cml0aW5nLlxuXHQgKi9cblx0dGVtcEZpbGVQYXRoOiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBJUHVyZ2VBcHBDb25maWdPcHRzIHtcblx0a2VlcFNjaGVkdWxlZEpvYnM/OiBib29sZWFuO1xuXHRrZWVwU2xhc2hjb21tYW5kcz86IGJvb2xlYW47XG5cdGtlZXBPdXRib3VuZENvbW11bmljYXRpb25Qcm92aWRlcnM/OiBib29sZWFuO1xufVxuXG5leHBvcnQgY2xhc3MgQXBwTWFuYWdlciB7XG5cdHB1YmxpYyBzdGF0aWMgSW5zdGFuY2U6IEFwcE1hbmFnZXI7XG5cblx0Ly8gYXBwcyBjb250YWlucyBhbGwgb2YgdGhlIEFwcHNcblx0cHJpdmF0ZSByZWFkb25seSBhcHBzOiBNYXA8c3RyaW5nLCBQcm94aWVkQXBwPjtcblxuXHRwcml2YXRlIHJlYWRvbmx5IGFwcE1ldGFkYXRhU3RvcmFnZTogQXBwTWV0YWRhdGFTdG9yYWdlO1xuXG5cdHByaXZhdGUgYXBwU291cmNlU3RvcmFnZTogQXBwU291cmNlU3RvcmFnZTtcblxuXHRwcml2YXRlIHJlYWRvbmx5IGxvZ1N0b3JhZ2U6IEFwcExvZ1N0b3JhZ2U7XG5cblx0cHJpdmF0ZSByZWFkb25seSBicmlkZ2VzOiBBcHBCcmlkZ2VzO1xuXG5cdHByaXZhdGUgcmVhZG9ubHkgcGFyc2VyOiBBcHBQYWNrYWdlUGFyc2VyO1xuXG5cdHByaXZhdGUgcmVhZG9ubHkgY29tcGlsZXI6IEFwcENvbXBpbGVyO1xuXG5cdHByaXZhdGUgcmVhZG9ubHkgYWNjZXNzb3JNYW5hZ2VyOiBBcHBBY2Nlc3Nvck1hbmFnZXI7XG5cblx0cHJpdmF0ZSByZWFkb25seSBsaXN0ZW5lck1hbmFnZXI6IEFwcExpc3RlbmVyTWFuYWdlcjtcblxuXHRwcml2YXRlIHJlYWRvbmx5IGNvbW1hbmRNYW5hZ2VyOiBBcHBTbGFzaENvbW1hbmRNYW5hZ2VyO1xuXG5cdHByaXZhdGUgcmVhZG9ubHkgYXBpTWFuYWdlcjogQXBwQXBpTWFuYWdlcjtcblxuXHRwcml2YXRlIHJlYWRvbmx5IGV4dGVybmFsQ29tcG9uZW50TWFuYWdlcjogQXBwRXh0ZXJuYWxDb21wb25lbnRNYW5hZ2VyO1xuXG5cdHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NNYW5hZ2VyOiBBcHBTZXR0aW5nc01hbmFnZXI7XG5cblx0cHJpdmF0ZSByZWFkb25seSBsaWNlbnNlTWFuYWdlcjogQXBwTGljZW5zZU1hbmFnZXI7XG5cblx0cHJpdmF0ZSByZWFkb25seSBzY2hlZHVsZXJNYW5hZ2VyOiBBcHBTY2hlZHVsZXJNYW5hZ2VyO1xuXG5cdHByaXZhdGUgcmVhZG9ubHkgdWlBY3Rpb25CdXR0b25NYW5hZ2VyOiBVSUFjdGlvbkJ1dHRvbk1hbmFnZXI7XG5cblx0cHJpdmF0ZSByZWFkb25seSB2aWRlb0NvbmZQcm92aWRlck1hbmFnZXI6IEFwcFZpZGVvQ29uZlByb3ZpZGVyTWFuYWdlcjtcblxuXHRwcml2YXRlIHJlYWRvbmx5IG91dGJvdW5kQ29tbXVuaWNhdGlvblByb3ZpZGVyTWFuYWdlcjogQXBwT3V0Ym91bmRDb21tdW5pY2F0aW9uUHJvdmlkZXJNYW5hZ2VyO1xuXG5cdHByaXZhdGUgcmVhZG9ubHkgc2lnbmF0dXJlTWFuYWdlcjogQXBwU2lnbmF0dXJlTWFuYWdlcjtcblxuXHRwcml2YXRlIHJlYWRvbmx5IHJ1bnRpbWU6IEFwcFJ1bnRpbWVNYW5hZ2VyO1xuXG5cdHByaXZhdGUgcmVhZG9ubHkgdGVtcEZpbGVQYXRoOiBzdHJpbmc7XG5cblx0cHJpdmF0ZSBpc0xvYWRlZDogYm9vbGVhbjtcblxuXHRjb25zdHJ1Y3Rvcih7IG1ldGFkYXRhU3RvcmFnZSwgbG9nU3RvcmFnZSwgYnJpZGdlcywgc291cmNlU3RvcmFnZSwgdGVtcEZpbGVQYXRoIH06IElBcHBNYW5hZ2VyRGVwcykge1xuXHRcdC8vIFNpbmdsZXRvbiBzdHlsZS4gVGhlcmUgY2FuIG9ubHkgZXZlciBiZSBvbmUgQXBwTWFuYWdlciBpbnN0YW5jZVxuXHRcdGlmICh0eXBlb2YgQXBwTWFuYWdlci5JbnN0YW5jZSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignVGhlcmUgaXMgYWxyZWFkeSBhIHZhbGlkIEFwcE1hbmFnZXIgaW5zdGFuY2UnKTtcblx0XHR9XG5cblx0XHRpZiAobWV0YWRhdGFTdG9yYWdlIGluc3RhbmNlb2YgQXBwTWV0YWRhdGFTdG9yYWdlKSB7XG5cdFx0XHR0aGlzLmFwcE1ldGFkYXRhU3RvcmFnZSA9IG1ldGFkYXRhU3RvcmFnZTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGluc3RhbmNlIG9mIHRoZSBBcHBNZXRhZGF0YVN0b3JhZ2UnKTtcblx0XHR9XG5cblx0XHRpZiAobG9nU3RvcmFnZSBpbnN0YW5jZW9mIEFwcExvZ1N0b3JhZ2UpIHtcblx0XHRcdHRoaXMubG9nU3RvcmFnZSA9IGxvZ1N0b3JhZ2U7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBpbnN0YW5jZSBvZiB0aGUgQXBwTG9nU3RvcmFnZScpO1xuXHRcdH1cblxuXHRcdGlmIChicmlkZ2VzIGluc3RhbmNlb2YgQXBwQnJpZGdlcykge1xuXHRcdFx0dGhpcy5icmlkZ2VzID0gYnJpZGdlcztcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGluc3RhbmNlIG9mIHRoZSBBcHBCcmlkZ2VzJyk7XG5cdFx0fVxuXG5cdFx0aWYgKHNvdXJjZVN0b3JhZ2UgaW5zdGFuY2VvZiBBcHBTb3VyY2VTdG9yYWdlKSB7XG5cdFx0XHR0aGlzLmFwcFNvdXJjZVN0b3JhZ2UgPSBzb3VyY2VTdG9yYWdlO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgaW5zdGFuY2Ugb2YgdGhlIEFwcFNvdXJjZVN0b3JhZ2UnKTtcblx0XHR9XG5cblx0XHR0aGlzLnRlbXBGaWxlUGF0aCA9IHRlbXBGaWxlUGF0aDtcblxuXHRcdHRoaXMuYXBwcyA9IG5ldyBNYXA8c3RyaW5nLCBQcm94aWVkQXBwPigpO1xuXG5cdFx0dGhpcy5wYXJzZXIgPSBuZXcgQXBwUGFja2FnZVBhcnNlcigpO1xuXHRcdHRoaXMuY29tcGlsZXIgPSBuZXcgQXBwQ29tcGlsZXIoKTtcblx0XHR0aGlzLmFjY2Vzc29yTWFuYWdlciA9IG5ldyBBcHBBY2Nlc3Nvck1hbmFnZXIodGhpcyk7XG5cdFx0dGhpcy5saXN0ZW5lck1hbmFnZXIgPSBuZXcgQXBwTGlzdGVuZXJNYW5hZ2VyKHRoaXMpO1xuXHRcdHRoaXMuY29tbWFuZE1hbmFnZXIgPSBuZXcgQXBwU2xhc2hDb21tYW5kTWFuYWdlcih0aGlzKTtcblx0XHR0aGlzLmFwaU1hbmFnZXIgPSBuZXcgQXBwQXBpTWFuYWdlcih0aGlzKTtcblx0XHR0aGlzLmV4dGVybmFsQ29tcG9uZW50TWFuYWdlciA9IG5ldyBBcHBFeHRlcm5hbENvbXBvbmVudE1hbmFnZXIoKTtcblx0XHR0aGlzLnNldHRpbmdzTWFuYWdlciA9IG5ldyBBcHBTZXR0aW5nc01hbmFnZXIodGhpcyk7XG5cdFx0dGhpcy5saWNlbnNlTWFuYWdlciA9IG5ldyBBcHBMaWNlbnNlTWFuYWdlcih0aGlzKTtcblx0XHR0aGlzLnNjaGVkdWxlck1hbmFnZXIgPSBuZXcgQXBwU2NoZWR1bGVyTWFuYWdlcih0aGlzKTtcblx0XHR0aGlzLnVpQWN0aW9uQnV0dG9uTWFuYWdlciA9IG5ldyBVSUFjdGlvbkJ1dHRvbk1hbmFnZXIodGhpcyk7XG5cdFx0dGhpcy52aWRlb0NvbmZQcm92aWRlck1hbmFnZXIgPSBuZXcgQXBwVmlkZW9Db25mUHJvdmlkZXJNYW5hZ2VyKHRoaXMpO1xuXHRcdHRoaXMub3V0Ym91bmRDb21tdW5pY2F0aW9uUHJvdmlkZXJNYW5hZ2VyID0gbmV3IEFwcE91dGJvdW5kQ29tbXVuaWNhdGlvblByb3ZpZGVyTWFuYWdlcih0aGlzKTtcblx0XHR0aGlzLnNpZ25hdHVyZU1hbmFnZXIgPSBuZXcgQXBwU2lnbmF0dXJlTWFuYWdlcih0aGlzKTtcblx0XHR0aGlzLnJ1bnRpbWUgPSBuZXcgQXBwUnVudGltZU1hbmFnZXIodGhpcyk7XG5cblx0XHR0aGlzLmlzTG9hZGVkID0gZmFsc2U7XG5cdFx0QXBwTWFuYWdlci5JbnN0YW5jZSA9IHRoaXM7XG5cdH1cblxuXHQvKipcblx0ICogR2V0cyB0aGUgcGF0aCB0byB0aGUgdGVtcG9yYXJ5IGZpbGUgc3RvcmFnZS5cblx0ICpcblx0ICogTWFpbmx5IHVzZWQgZm9yIHVwbG9hZCBldmVudHNcblx0ICovXG5cdHB1YmxpYyBnZXRUZW1wRmlsZVBhdGgoKTogc3RyaW5nIHtcblx0XHRyZXR1cm4gdGhpcy50ZW1wRmlsZVBhdGg7XG5cdH1cblxuXHQvKiogR2V0cyB0aGUgaW5zdGFuY2Ugb2YgdGhlIHN0b3JhZ2UgY29ubmVjdG9yLiAqL1xuXHRwdWJsaWMgZ2V0U3RvcmFnZSgpOiBBcHBNZXRhZGF0YVN0b3JhZ2Uge1xuXHRcdHJldHVybiB0aGlzLmFwcE1ldGFkYXRhU3RvcmFnZTtcblx0fVxuXG5cdC8qKiBHZXRzIHRoZSBpbnN0YW5jZSBvZiB0aGUgbG9nIHN0b3JhZ2UgY29ubmVjdG9yLiAqL1xuXHRwdWJsaWMgZ2V0TG9nU3RvcmFnZSgpOiBBcHBMb2dTdG9yYWdlIHtcblx0XHRyZXR1cm4gdGhpcy5sb2dTdG9yYWdlO1xuXHR9XG5cblx0LyoqIEdldHMgdGhlIGluc3RhbmNlIG9mIHRoZSBBcHAgcGFja2FnZSBwYXJzZXIuICovXG5cdHB1YmxpYyBnZXRQYXJzZXIoKTogQXBwUGFja2FnZVBhcnNlciB7XG5cdFx0cmV0dXJuIHRoaXMucGFyc2VyO1xuXHR9XG5cblx0LyoqIEdldHMgdGhlIGNvbXBpbGVyIGluc3RhbmNlLiAqL1xuXHRwdWJsaWMgZ2V0Q29tcGlsZXIoKTogQXBwQ29tcGlsZXIge1xuXHRcdHJldHVybiB0aGlzLmNvbXBpbGVyO1xuXHR9XG5cblx0LyoqIEdldHMgdGhlIGFjY2Vzc29yIG1hbmFnZXIgaW5zdGFuY2UuICovXG5cdHB1YmxpYyBnZXRBY2Nlc3Nvck1hbmFnZXIoKTogQXBwQWNjZXNzb3JNYW5hZ2VyIHtcblx0XHRyZXR1cm4gdGhpcy5hY2Nlc3Nvck1hbmFnZXI7XG5cdH1cblxuXHQvKiogR2V0cyB0aGUgaW5zdGFuY2Ugb2YgdGhlIEJyaWRnZSBtYW5hZ2VyLiAqL1xuXHRwdWJsaWMgZ2V0QnJpZGdlcygpOiBBcHBCcmlkZ2VzIHtcblx0XHRyZXR1cm4gdGhpcy5icmlkZ2VzO1xuXHR9XG5cblx0LyoqIEdldHMgdGhlIGluc3RhbmNlIG9mIHRoZSBsaXN0ZW5lciBtYW5hZ2VyLiAqL1xuXHRwdWJsaWMgZ2V0TGlzdGVuZXJNYW5hZ2VyKCk6IEFwcExpc3RlbmVyTWFuYWdlciB7XG5cdFx0cmV0dXJuIHRoaXMubGlzdGVuZXJNYW5hZ2VyO1xuXHR9XG5cblx0LyoqIEdldHMgdGhlIGNvbW1hbmQgbWFuYWdlcidzIGluc3RhbmNlLiAqL1xuXHRwdWJsaWMgZ2V0Q29tbWFuZE1hbmFnZXIoKTogQXBwU2xhc2hDb21tYW5kTWFuYWdlciB7XG5cdFx0cmV0dXJuIHRoaXMuY29tbWFuZE1hbmFnZXI7XG5cdH1cblxuXHRwdWJsaWMgZ2V0VmlkZW9Db25mUHJvdmlkZXJNYW5hZ2VyKCk6IEFwcFZpZGVvQ29uZlByb3ZpZGVyTWFuYWdlciB7XG5cdFx0cmV0dXJuIHRoaXMudmlkZW9Db25mUHJvdmlkZXJNYW5hZ2VyO1xuXHR9XG5cblx0cHVibGljIGdldE91dGJvdW5kQ29tbXVuaWNhdGlvblByb3ZpZGVyTWFuYWdlcigpOiBBcHBPdXRib3VuZENvbW11bmljYXRpb25Qcm92aWRlck1hbmFnZXIge1xuXHRcdHJldHVybiB0aGlzLm91dGJvdW5kQ29tbXVuaWNhdGlvblByb3ZpZGVyTWFuYWdlcjtcblx0fVxuXG5cdHB1YmxpYyBnZXRMaWNlbnNlTWFuYWdlcigpOiBBcHBMaWNlbnNlTWFuYWdlciB7XG5cdFx0cmV0dXJuIHRoaXMubGljZW5zZU1hbmFnZXI7XG5cdH1cblxuXHQvKiogR2V0cyB0aGUgYXBpIG1hbmFnZXIncyBpbnN0YW5jZS4gKi9cblx0cHVibGljIGdldEFwaU1hbmFnZXIoKTogQXBwQXBpTWFuYWdlciB7XG5cdFx0cmV0dXJuIHRoaXMuYXBpTWFuYWdlcjtcblx0fVxuXG5cdC8qKiBHZXRzIHRoZSBleHRlcm5hbCBjb21wb25lbnQgbWFuYWdlcidzIGluc3RhbmNlLiAqL1xuXHRwdWJsaWMgZ2V0RXh0ZXJuYWxDb21wb25lbnRNYW5hZ2VyKCk6IEFwcEV4dGVybmFsQ29tcG9uZW50TWFuYWdlciB7XG5cdFx0cmV0dXJuIHRoaXMuZXh0ZXJuYWxDb21wb25lbnRNYW5hZ2VyO1xuXHR9XG5cblx0LyoqIEdldHMgdGhlIG1hbmFnZXIgb2YgdGhlIHNldHRpbmdzLCB1cGRhdGVzIGFuZCBnZXR0aW5nLiAqL1xuXHRwdWJsaWMgZ2V0U2V0dGluZ3NNYW5hZ2VyKCk6IEFwcFNldHRpbmdzTWFuYWdlciB7XG5cdFx0cmV0dXJuIHRoaXMuc2V0dGluZ3NNYW5hZ2VyO1xuXHR9XG5cblx0cHVibGljIGdldFNjaGVkdWxlck1hbmFnZXIoKTogQXBwU2NoZWR1bGVyTWFuYWdlciB7XG5cdFx0cmV0dXJuIHRoaXMuc2NoZWR1bGVyTWFuYWdlcjtcblx0fVxuXG5cdHB1YmxpYyBnZXRVSUFjdGlvbkJ1dHRvbk1hbmFnZXIoKTogVUlBY3Rpb25CdXR0b25NYW5hZ2VyIHtcblx0XHRyZXR1cm4gdGhpcy51aUFjdGlvbkJ1dHRvbk1hbmFnZXI7XG5cdH1cblxuXHRwdWJsaWMgZ2V0U2lnbmF0dXJlTWFuYWdlcigpOiBBcHBTaWduYXR1cmVNYW5hZ2VyIHtcblx0XHRyZXR1cm4gdGhpcy5zaWduYXR1cmVNYW5hZ2VyO1xuXHR9XG5cblx0cHVibGljIGdldFJ1bnRpbWUoKTogQXBwUnVudGltZU1hbmFnZXIge1xuXHRcdHJldHVybiB0aGlzLnJ1bnRpbWU7XG5cdH1cblxuXHQvKiogR2V0cyB3aGV0aGVyIHRoZSBBcHBzIGhhdmUgYmVlbiBsb2FkZWQgb3Igbm90LiAqL1xuXHRwdWJsaWMgYXJlQXBwc0xvYWRlZCgpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gdGhpcy5pc0xvYWRlZDtcblx0fVxuXG5cdHB1YmxpYyBzZXRTb3VyY2VTdG9yYWdlKHN0b3JhZ2U6IEFwcFNvdXJjZVN0b3JhZ2UpOiB2b2lkIHtcblx0XHR0aGlzLmFwcFNvdXJjZVN0b3JhZ2UgPSBzdG9yYWdlO1xuXHR9XG5cblx0LyoqXG5cdCAqIEdvZXMgdGhyb3VnaCB0aGUgZW50aXJlIGxvYWRpbmcgdXAgcHJvY2Vzcy5cblx0ICogRXhwZWN0IHRoaXMgdG8gdGFrZSBzb21lIHRpbWUsIGFzIGl0IGdvZXMgdGhyb3VnaCBhIHZlcnlcblx0ICogbG9uZyBwcm9jZXNzIG9mIGxvYWRpbmcgYWxsIHRoZSBBcHBzIHVwLlxuXHQgKi9cblx0cHVibGljIGFzeW5jIGxvYWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG5cdFx0Ly8gWW91IGNhbiBub3QgbG9hZCB0aGUgQXBwTWFuYWdlciBzeXN0ZW0gYWdhaW5cblx0XHQvLyBpZiBpdCBoYXMgYWxyZWFkeSBiZWVuIGxvYWRlZC5cblx0XHRpZiAodGhpcy5pc0xvYWRlZCkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0Y29uc3QgaXRlbXM6IE1hcDxzdHJpbmcsIElBcHBTdG9yYWdlSXRlbT4gPSBhd2FpdCB0aGlzLmFwcE1ldGFkYXRhU3RvcmFnZS5yZXRyaWV2ZUFsbCgpO1xuXG5cdFx0Zm9yIChjb25zdCBpdGVtIG9mIGl0ZW1zLnZhbHVlcygpKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRjb25zdCBhcHBQYWNrYWdlID0gYXdhaXQgdGhpcy5hcHBTb3VyY2VTdG9yYWdlLmZldGNoKGl0ZW0pO1xuXHRcdFx0XHRjb25zdCB1bnBhY2thZ2VSZXN1bHQgPSBhd2FpdCB0aGlzLmdldFBhcnNlcigpLnVucGFja2FnZUFwcChhcHBQYWNrYWdlKTtcblxuXHRcdFx0XHRjb25zdCBhcHAgPSBhd2FpdCB0aGlzLmdldENvbXBpbGVyKCkudG9TYW5kQm94KHRoaXMsIGl0ZW0sIHVucGFja2FnZVJlc3VsdCk7XG5cblx0XHRcdFx0dGhpcy5hcHBzLnNldChpdGVtLmlkLCBhcHApO1xuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRjb25zb2xlLndhcm4oYEVycm9yIHdoaWxlIGNvbXBpbGluZyB0aGUgQXBwIFwiJHtpdGVtLmluZm8ubmFtZX0gKCR7aXRlbS5pZH0pXCI6YCk7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoZSk7XG5cblx0XHRcdFx0Y29uc3QgcHJsID0gbmV3IFByb3hpZWRBcHAodGhpcywgaXRlbSwgbmV3IEVtcHR5UnVudGltZShpdGVtLmlkKSk7XG5cblx0XHRcdFx0dGhpcy5hcHBzLnNldChpdGVtLmlkLCBwcmwpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHRoaXMuaXNMb2FkZWQgPSB0cnVlO1xuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cblx0cHVibGljIGFzeW5jIGVuYWJsZUFsbCgpOiBQcm9taXNlPEFycmF5PEFwcEZhYnJpY2F0aW9uRnVsZmlsbG1lbnQ+PiB7XG5cdFx0Y29uc3QgYWZmczogQXJyYXk8QXBwRmFicmljYXRpb25GdWxmaWxsbWVudD4gPSBbXTtcblxuXHRcdC8vIExldCdzIGluaXRpYWxpemUgdGhlbVxuXHRcdGZvciAoY29uc3Qgcmwgb2YgdGhpcy5hcHBzLnZhbHVlcygpKSB7XG5cdFx0XHRjb25zdCBhZmYgPSBuZXcgQXBwRmFicmljYXRpb25GdWxmaWxsbWVudCgpO1xuXG5cdFx0XHRhZmYuc2V0QXBwSW5mbyhybC5nZXRJbmZvKCkpO1xuXHRcdFx0YWZmLnNldEltcGxlbWVudGVkSW50ZXJmYWNlcyhybC5nZXRJbXBsZW1lbnRhdGlvbkxpc3QoKSk7XG5cdFx0XHRhZmYuc2V0QXBwKHJsKTtcblx0XHRcdGFmZnMucHVzaChhZmYpO1xuXG5cdFx0XHRpZiAoQXBwU3RhdHVzVXRpbHMuaXNEaXNhYmxlZChhd2FpdCBybC5nZXRTdGF0dXMoKSkpIHtcblx0XHRcdFx0Ly8gVXN1YWxseSBpZiBhbiBBcHAgaXMgZGlzYWJsZWQgYmVmb3JlIGl0J3MgaW5pdGlhbGl6ZWQsXG5cdFx0XHRcdC8vIHRoZW4gc29tZXRoaW5nIChzdWNoIGFzIGFuIGVycm9yKSBvY2N1cmVkIHdoaWxlXG5cdFx0XHRcdC8vIGl0IHdhcyBjb21waWxlZCBvciBzb21ldGhpbmcgc2ltaWxhci5cblx0XHRcdFx0Ly8gV2Ugc3RpbGwgaGF2ZSB0byB2YWxpZGF0ZSBpdHMgbGljZW5zZSwgdGhvdWdoXG5cdFx0XHRcdGF3YWl0IHJsLnZhbGlkYXRlTGljZW5zZSgpO1xuXG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRhd2FpdCB0aGlzLmluaXRpYWxpemVBcHAocmwsIHRydWUpLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xuXHRcdH1cblxuXHRcdC8vIExldCdzIGVuc3VyZSB0aGUgcmVxdWlyZWQgc2V0dGluZ3MgYXJlIGFsbCBzZXRcblx0XHRmb3IgKGNvbnN0IHJsIG9mIHRoaXMuYXBwcy52YWx1ZXMoKSkge1xuXHRcdFx0aWYgKEFwcFN0YXR1c1V0aWxzLmlzRGlzYWJsZWQoYXdhaXQgcmwuZ2V0U3RhdHVzKCkpKSB7XG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIXRoaXMuYXJlUmVxdWlyZWRTZXR0aW5nc1NldChybC5nZXRTdG9yYWdlSXRlbSgpKSkge1xuXHRcdFx0XHRhd2FpdCBybC5zZXRTdGF0dXMoQXBwU3RhdHVzLklOVkFMSURfU0VUVElOR1NfRElTQUJMRUQpLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIE5vdyBsZXQncyBlbmFibGUgdGhlIGFwcHMgd2hpY2ggd2VyZSBvbmNlIGVuYWJsZWRcblx0XHQvLyBidXQgYXJlIG5vdCBjdXJyZW50bHkgZGlzYWJsZWQuXG5cdFx0Zm9yIChjb25zdCBhcHAgb2YgdGhpcy5hcHBzLnZhbHVlcygpKSB7XG5cdFx0XHRjb25zdCBzdGF0dXMgPSBhd2FpdCBhcHAuZ2V0U3RhdHVzKCk7XG5cdFx0XHRpZiAoIUFwcFN0YXR1c1V0aWxzLmlzRGlzYWJsZWQoc3RhdHVzKSAmJiBBcHBTdGF0dXNVdGlscy5pc0VuYWJsZWQoYXBwLmdldFByZXZpb3VzU3RhdHVzKCkpKSB7XG5cdFx0XHRcdGF3YWl0IHRoaXMuZW5hYmxlQXBwKGFwcCkuY2F0Y2goY29uc29sZS5lcnJvcik7XG5cdFx0XHR9IGVsc2UgaWYgKCFBcHBTdGF0dXNVdGlscy5pc0Vycm9yKHN0YXR1cykpIHtcblx0XHRcdFx0dGhpcy5saXN0ZW5lck1hbmFnZXIubG9ja0Vzc2VudGlhbEV2ZW50cyhhcHApO1xuXHRcdFx0XHR0aGlzLnVpQWN0aW9uQnV0dG9uTWFuYWdlci5jbGVhckFwcEFjdGlvbkJ1dHRvbnMoYXBwLmdldElEKCkpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBhZmZzO1xuXHR9XG5cblx0cHVibGljIGFzeW5jIHVubG9hZChpc01hbnVhbDogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xuXHRcdC8vIElmIHRoZSBBcHBNYW5hZ2VyIGhhc24ndCBiZWVuIGxvYWRlZCB5ZXQsIHRoZW5cblx0XHQvLyB0aGVyZSBpcyBub3RoaW5nIHRvIHVubG9hZFxuXHRcdGlmICghdGhpcy5pc0xvYWRlZCkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGZvciAoY29uc3QgYXBwIG9mIHRoaXMuYXBwcy52YWx1ZXMoKSkge1xuXHRcdFx0Y29uc3Qgc3RhdHVzID0gYXdhaXQgYXBwLmdldFN0YXR1cygpO1xuXHRcdFx0aWYgKHN0YXR1cyA9PT0gQXBwU3RhdHVzLklOSVRJQUxJWkVEKSB7XG5cdFx0XHRcdGF3YWl0IHRoaXMucHVyZ2VBcHBDb25maWcoYXBwKTtcblx0XHRcdH0gZWxzZSBpZiAoIUFwcFN0YXR1c1V0aWxzLmlzRGlzYWJsZWQoc3RhdHVzKSkge1xuXHRcdFx0XHRhd2FpdCB0aGlzLmRpc2FibGUoYXBwLmdldElEKCksIGlzTWFudWFsID8gQXBwU3RhdHVzLk1BTlVBTExZX0RJU0FCTEVEIDogQXBwU3RhdHVzLkRJU0FCTEVEKTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5saXN0ZW5lck1hbmFnZXIucmVsZWFzZUVzc2VudGlhbEV2ZW50cyhhcHApO1xuXG5cdFx0XHR2b2lkIGFwcC5nZXRSdW50aW1lQ29udHJvbGxlcigpLnN0b3BBcHAoKTtcblx0XHR9XG5cblx0XHQvLyBSZW1vdmUgYWxsIHRoZSBhcHBzIGZyb20gdGhlIHN5c3RlbSBub3cgdGhhdCB3ZSBoYXZlIHVubG9hZGVkIGV2ZXJ5dGhpbmdcblx0XHR0aGlzLmFwcHMuY2xlYXIoKTtcblxuXHRcdHRoaXMuaXNMb2FkZWQgPSBmYWxzZTtcblx0fVxuXG5cdC8qKiBHZXRzIHRoZSBBcHBzIHdoaWNoIG1hdGNoIHRoZSBmaWx0ZXIgcGFzc2VkIGluLiAqL1xuXHRwdWJsaWMgYXN5bmMgZ2V0KGZpbHRlcj86IElHZXRBcHBzRmlsdGVyKTogUHJvbWlzZTxQcm94aWVkQXBwW10+IHtcblx0XHRsZXQgcmxzOiBBcnJheTxQcm94aWVkQXBwPiA9IFtdO1xuXG5cdFx0aWYgKHR5cGVvZiBmaWx0ZXIgPT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHR0aGlzLmFwcHMuZm9yRWFjaCgocmwpID0+IHJscy5wdXNoKHJsKSk7XG5cblx0XHRcdHJldHVybiBybHM7XG5cdFx0fVxuXG5cdFx0bGV0IG5vdGhpbmcgPSB0cnVlO1xuXG5cdFx0aWYgKHR5cGVvZiBmaWx0ZXIuZW5hYmxlZCA9PT0gJ2Jvb2xlYW4nICYmIGZpbHRlci5lbmFibGVkKSB7XG5cdFx0XHRmb3IgKGNvbnN0IHJsIG9mIHRoaXMuYXBwcy52YWx1ZXMoKSkge1xuXHRcdFx0XHRpZiAoQXBwU3RhdHVzVXRpbHMuaXNFbmFibGVkKGF3YWl0IHJsLmdldFN0YXR1cygpKSkge1xuXHRcdFx0XHRcdHJscy5wdXNoKHJsKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRub3RoaW5nID0gZmFsc2U7XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiBmaWx0ZXIuZGlzYWJsZWQgPT09ICdib29sZWFuJyAmJiBmaWx0ZXIuZGlzYWJsZWQpIHtcblx0XHRcdGZvciAoY29uc3Qgcmwgb2YgdGhpcy5hcHBzLnZhbHVlcygpKSB7XG5cdFx0XHRcdGlmIChBcHBTdGF0dXNVdGlscy5pc0Rpc2FibGVkKGF3YWl0IHJsLmdldFN0YXR1cygpKSkge1xuXHRcdFx0XHRcdHJscy5wdXNoKHJsKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRub3RoaW5nID0gZmFsc2U7XG5cdFx0fVxuXG5cdFx0aWYgKG5vdGhpbmcpIHtcblx0XHRcdHRoaXMuYXBwcy5mb3JFYWNoKChybCkgPT4gcmxzLnB1c2gocmwpKTtcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIGZpbHRlci5pZHMgIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRybHMgPSBybHMuZmlsdGVyKChybCkgPT4gZmlsdGVyLmlkcy5pbmNsdWRlcyhybC5nZXRJRCgpKSk7XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiBmaWx0ZXIuaW5zdGFsbGF0aW9uU291cmNlICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0cmxzID0gcmxzLmZpbHRlcigocmwpID0+IHJsLmdldEluc3RhbGxhdGlvblNvdXJjZSgpID09PSBmaWx0ZXIuaW5zdGFsbGF0aW9uU291cmNlKTtcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIGZpbHRlci5uYW1lID09PSAnc3RyaW5nJykge1xuXHRcdFx0cmxzID0gcmxzLmZpbHRlcigocmwpID0+IHJsLmdldE5hbWUoKSA9PT0gZmlsdGVyLm5hbWUpO1xuXHRcdH0gZWxzZSBpZiAoZmlsdGVyLm5hbWUgaW5zdGFuY2VvZiBSZWdFeHApIHtcblx0XHRcdHJscyA9IHJscy5maWx0ZXIoKHJsKSA9PiAoZmlsdGVyLm5hbWUgYXMgUmVnRXhwKS50ZXN0KHJsLmdldE5hbWUoKSkpO1xuXHRcdH1cblxuXHRcdHJldHVybiBybHM7XG5cdH1cblxuXHQvKiogR2V0cyBhIHNpbmdsZSBBcHAgYnkgdGhlIGlkIHBhc3NlZCBpbi4gKi9cblx0cHVibGljIGdldE9uZUJ5SWQoYXBwSWQ6IHN0cmluZyk6IFByb3hpZWRBcHAge1xuXHRcdHJldHVybiB0aGlzLmFwcHMuZ2V0KGFwcElkKTtcblx0fVxuXG5cdHB1YmxpYyBnZXRQZXJtaXNzaW9uc0J5SWQoYXBwSWQ6IHN0cmluZyk6IEFycmF5PElQZXJtaXNzaW9uPiB7XG5cdFx0Y29uc3QgYXBwID0gdGhpcy5hcHBzLmdldChhcHBJZCk7XG5cblx0XHRpZiAoIWFwcCkge1xuXHRcdFx0cmV0dXJuIFtdO1xuXHRcdH1cblx0XHRjb25zdCB7IHBlcm1pc3Npb25zR3JhbnRlZCB9ID0gYXBwLmdldFN0b3JhZ2VJdGVtKCk7XG5cblx0XHRyZXR1cm4gcGVybWlzc2lvbnNHcmFudGVkIHx8IGRlZmF1bHRQZXJtaXNzaW9ucztcblx0fVxuXG5cdHB1YmxpYyBhc3luYyBlbmFibGUoaWQ6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdGNvbnN0IHJsID0gdGhpcy5hcHBzLmdldChpZCk7XG5cblx0XHRpZiAoIXJsKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYE5vIEFwcCBieSB0aGUgaWQgXCIke2lkfVwiIGV4aXN0cy5gKTtcblx0XHR9XG5cblx0XHRjb25zdCBzdGF0dXMgPSBhd2FpdCBybC5nZXRTdGF0dXMoKTtcblxuXHRcdGlmIChBcHBTdGF0dXNVdGlscy5pc0VuYWJsZWQoc3RhdHVzKSkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0aWYgKHN0YXR1cyA9PT0gQXBwU3RhdHVzLkNPTVBJTEVSX0VSUk9SX0RJU0FCTEVEKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ1RoZSBBcHAgaGFkIGNvbXBpbGVyIGVycm9ycywgY2FuIG5vdCBlbmFibGUgaXQuJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgc3RvcmFnZUl0ZW0gPSBhd2FpdCB0aGlzLmFwcE1ldGFkYXRhU3RvcmFnZS5yZXRyaWV2ZU9uZShpZCk7XG5cblx0XHRpZiAoIXN0b3JhZ2VJdGVtKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCBlbmFibGUgYW4gQXBwIHdpdGggdGhlIGlkIG9mIFwiJHtpZH1cIiBhcyBpdCBkb2Vzbid0IGV4aXN0LmApO1xuXHRcdH1cblxuXHRcdGNvbnN0IGlzU2V0dXAgPSBhd2FpdCB0aGlzLnJ1blN0YXJ0VXBQcm9jZXNzKHN0b3JhZ2VJdGVtLCBybCwgZmFsc2UpO1xuXG5cdFx0cmV0dXJuIGlzU2V0dXA7XG5cdH1cblxuXHRwdWJsaWMgYXN5bmMgZGlzYWJsZShpZDogc3RyaW5nLCBzdGF0dXM6IEFwcFN0YXR1cyA9IEFwcFN0YXR1cy5ESVNBQkxFRCwgc2lsZW50PzogYm9vbGVhbik6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdGlmICghQXBwU3RhdHVzVXRpbHMuaXNEaXNhYmxlZChzdGF0dXMpKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgZGlzYWJsZWQgc3RhdHVzJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgYXBwID0gdGhpcy5hcHBzLmdldChpZCk7XG5cblx0XHRpZiAoIWFwcCkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBObyBBcHAgYnkgdGhlIGlkIFwiJHtpZH1cIiBleGlzdHMuYCk7XG5cdFx0fVxuXG5cdFx0aWYgKEFwcFN0YXR1c1V0aWxzLmlzRW5hYmxlZChhd2FpdCBhcHAuZ2V0U3RhdHVzKCkpKSB7XG5cdFx0XHRhd2FpdCBhcHAuY2FsbChBcHBNZXRob2QuT05ESVNBQkxFKS5jYXRjaCgoZSkgPT4gY29uc29sZS53YXJuKCdFcnJvciB3aGlsZSBkaXNhYmxpbmc6JywgZSkpO1xuXHRcdH1cblxuXHRcdGF3YWl0IHRoaXMucHVyZ2VBcHBDb25maWcoYXBwLCB7XG5cdFx0XHRrZWVwU2NoZWR1bGVkSm9iczogdHJ1ZSxcblx0XHRcdGtlZXBTbGFzaGNvbW1hbmRzOiB0cnVlLFxuXHRcdFx0a2VlcE91dGJvdW5kQ29tbXVuaWNhdGlvblByb3ZpZGVyczogdHJ1ZSxcblx0XHR9KTtcblxuXHRcdGF3YWl0IGFwcC5zZXRTdGF0dXMoc3RhdHVzLCBzaWxlbnQpO1xuXG5cdFx0Y29uc3Qgc3RvcmFnZUl0ZW0gPSBhd2FpdCB0aGlzLmFwcE1ldGFkYXRhU3RvcmFnZS5yZXRyaWV2ZU9uZShpZCk7XG5cblx0XHRhcHAuZ2V0U3RvcmFnZUl0ZW0oKS5tYXJrZXRwbGFjZUluZm8gPSBzdG9yYWdlSXRlbS5tYXJrZXRwbGFjZUluZm87XG5cdFx0YXdhaXQgYXBwLnZhbGlkYXRlTGljZW5zZSgpLmNhdGNoKCgpID0+IHt9KTtcblxuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cblx0cHVibGljIGFzeW5jIG1pZ3JhdGUoaWQ6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdGNvbnN0IGFwcCA9IHRoaXMuYXBwcy5nZXQoaWQpO1xuXG5cdFx0aWYgKCFhcHApIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihgTm8gQXBwIGJ5IHRoZSBpZCBcIiR7aWR9XCIgZXhpc3RzLmApO1xuXHRcdH1cblxuXHRcdGF3YWl0IGFwcC5jYWxsKEFwcE1ldGhvZC5PTlVQREFURSkuY2F0Y2goKGUpID0+IGNvbnNvbGUud2FybignRXJyb3Igd2hpbGUgbWlncmF0aW5nOicsIGUpKTtcblxuXHRcdGF3YWl0IHRoaXMucHVyZ2VBcHBDb25maWcoYXBwLCB7IGtlZXBTY2hlZHVsZWRKb2JzOiB0cnVlIH0pO1xuXG5cdFx0Y29uc3Qgc3RvcmFnZUl0ZW0gPSBhd2FpdCB0aGlzLmFwcE1ldGFkYXRhU3RvcmFnZS5yZXRyaWV2ZU9uZShpZCk7XG5cblx0XHRhcHAuZ2V0U3RvcmFnZUl0ZW0oKS5tYXJrZXRwbGFjZUluZm8gPSBzdG9yYWdlSXRlbS5tYXJrZXRwbGFjZUluZm87XG5cdFx0YXdhaXQgYXBwLnZhbGlkYXRlTGljZW5zZSgpLmNhdGNoKCgpID0+IHt9KTtcblxuXHRcdHN0b3JhZ2VJdGVtLm1pZ3JhdGVkID0gdHJ1ZTtcblx0XHRzdG9yYWdlSXRlbS5zaWduYXR1cmUgPSBhd2FpdCB0aGlzLmdldFNpZ25hdHVyZU1hbmFnZXIoKS5zaWduQXBwKHN0b3JhZ2VJdGVtKTtcblxuXHRcdGNvbnN0IHsgbWFya2V0cGxhY2VJbmZvLCBzaWduYXR1cmUsIG1pZ3JhdGVkLCBfaWQgfSA9IHN0b3JhZ2VJdGVtO1xuXHRcdGNvbnN0IHN0b3JlZCA9IGF3YWl0IHRoaXMuYXBwTWV0YWRhdGFTdG9yYWdlLnVwZGF0ZVBhcnRpYWxBbmRSZXR1cm5Eb2N1bWVudCh7IG1hcmtldHBsYWNlSW5mbywgc2lnbmF0dXJlLCBtaWdyYXRlZCwgX2lkIH0pO1xuXG5cdFx0YXdhaXQgdGhpcy51cGRhdGVMb2NhbChzdG9yZWQsIGFwcCk7XG5cdFx0YXdhaXQgdGhpcy5icmlkZ2VzXG5cdFx0XHQuZ2V0QXBwQWN0aXZhdGlvbkJyaWRnZSgpXG5cdFx0XHQuZG9BcHBVcGRhdGVkKGFwcClcblx0XHRcdC5jYXRjaCgoKSA9PiB7fSk7XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxuXG5cdHB1YmxpYyBhc3luYyBhZGRMb2NhbChhcHBJZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3Qgc3RvcmFnZUl0ZW0gPSBhd2FpdCB0aGlzLmFwcE1ldGFkYXRhU3RvcmFnZS5yZXRyaWV2ZU9uZShhcHBJZCk7XG5cblx0XHRpZiAoIXN0b3JhZ2VJdGVtKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYEFwcCB3aXRoIGlkICR7YXBwSWR9IGNvdWxkbid0IGJlIGZvdW5kYCk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgYXBwUGFja2FnZSA9IGF3YWl0IHRoaXMuYXBwU291cmNlU3RvcmFnZS5mZXRjaChzdG9yYWdlSXRlbSk7XG5cblx0XHRpZiAoIWFwcFBhY2thZ2UpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihgUGFja2FnZSBmaWxlIGZvciBhcHAgXCIke3N0b3JhZ2VJdGVtLmluZm8ubmFtZX1cIiAoJHthcHBJZH0pIGNvdWxkbid0IGJlIGZvdW5kYCk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgcGFyc2VkUGFja2FnZSA9IGF3YWl0IHRoaXMuZ2V0UGFyc2VyKCkudW5wYWNrYWdlQXBwKGFwcFBhY2thZ2UpO1xuXHRcdGNvbnN0IGFwcCA9IGF3YWl0IHRoaXMuZ2V0Q29tcGlsZXIoKS50b1NhbmRCb3godGhpcywgc3RvcmFnZUl0ZW0sIHBhcnNlZFBhY2thZ2UpO1xuXG5cdFx0dGhpcy5hcHBzLnNldChhcHAuZ2V0SUQoKSwgYXBwKTtcblxuXHRcdGF3YWl0IHRoaXMubG9hZE9uZShhcHBJZCk7XG5cdH1cblxuXHRwdWJsaWMgYXN5bmMgYWRkKGFwcFBhY2thZ2U6IEJ1ZmZlciwgaW5zdGFsbGF0aW9uUGFyYW1ldGVyczogSUFwcEluc3RhbGxQYXJhbWV0ZXJzKTogUHJvbWlzZTxBcHBGYWJyaWNhdGlvbkZ1bGZpbGxtZW50PiB7XG5cdFx0Y29uc3QgeyBlbmFibGUgPSB0cnVlLCBtYXJrZXRwbGFjZUluZm8sIHBlcm1pc3Npb25zR3JhbnRlZCwgdXNlciB9ID0gaW5zdGFsbGF0aW9uUGFyYW1ldGVycztcblxuXHRcdGNvbnN0IGFmZiA9IG5ldyBBcHBGYWJyaWNhdGlvbkZ1bGZpbGxtZW50KCk7XG5cdFx0Y29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5nZXRQYXJzZXIoKS51bnBhY2thZ2VBcHAoYXBwUGFja2FnZSk7XG5cdFx0Y29uc3QgdW5kb1N0ZXBzOiBBcnJheTwoKSA9PiBQcm9taXNlPHZvaWQ+PiA9IFtdO1xuXG5cdFx0YWZmLnNldEFwcEluZm8ocmVzdWx0LmluZm8pO1xuXHRcdGFmZi5zZXRJbXBsZW1lbnRlZEludGVyZmFjZXMocmVzdWx0LmltcGxlbWVudGVkLmdldFZhbHVlcygpKTtcblxuXHRcdGNvbnN0IGRlc2NyaXB0b3I6IElBcHBTdG9yYWdlSXRlbSA9IHtcblx0XHRcdGlkOiByZXN1bHQuaW5mby5pZCxcblx0XHRcdGluZm86IHJlc3VsdC5pbmZvLFxuXHRcdFx0c3RhdHVzOiBlbmFibGUgPyBBcHBTdGF0dXMuTUFOVUFMTFlfRU5BQkxFRCA6IEFwcFN0YXR1cy5NQU5VQUxMWV9ESVNBQkxFRCxcblx0XHRcdHNldHRpbmdzOiB7fSxcblx0XHRcdGltcGxlbWVudGVkOiByZXN1bHQuaW1wbGVtZW50ZWQuZ2V0VmFsdWVzKCksXG5cdFx0XHRpbnN0YWxsYXRpb25Tb3VyY2U6IG1hcmtldHBsYWNlSW5mbyA/IEFwcEluc3RhbGxhdGlvblNvdXJjZS5NQVJLRVRQTEFDRSA6IEFwcEluc3RhbGxhdGlvblNvdXJjZS5QUklWQVRFLFxuXHRcdFx0bWFya2V0cGxhY2VJbmZvLFxuXHRcdFx0cGVybWlzc2lvbnNHcmFudGVkLFxuXHRcdFx0bGFuZ3VhZ2VDb250ZW50OiByZXN1bHQubGFuZ3VhZ2VDb250ZW50LFxuXHRcdH07XG5cblx0XHR0cnkge1xuXHRcdFx0ZGVzY3JpcHRvci5zb3VyY2VQYXRoID0gYXdhaXQgdGhpcy5hcHBTb3VyY2VTdG9yYWdlLnN0b3JlKGRlc2NyaXB0b3IsIGFwcFBhY2thZ2UpO1xuXG5cdFx0XHR1bmRvU3RlcHMucHVzaCgoKSA9PiB0aGlzLmFwcFNvdXJjZVN0b3JhZ2UucmVtb3ZlKGRlc2NyaXB0b3IpKTtcblx0XHR9IGNhdGNoIHtcblx0XHRcdGFmZi5zZXRTdG9yYWdlRXJyb3IoJ0ZhaWxlZCB0byBzdG9yZSBhcHAgcGFja2FnZScpO1xuXG5cdFx0XHRyZXR1cm4gYWZmO1xuXHRcdH1cblxuXHRcdGxldCBhcHA6IFByb3hpZWRBcHA7XG5cblx0XHR0cnkge1xuXHRcdFx0YXBwID0gYXdhaXQgdGhpcy5nZXRDb21waWxlcigpLnRvU2FuZEJveCh0aGlzLCBkZXNjcmlwdG9yLCByZXN1bHQpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRhd2FpdCBQcm9taXNlLmFsbCh1bmRvU3RlcHMubWFwKCh1bmRvZXIpID0+IHVuZG9lcigpKSk7XG5cblx0XHRcdHRocm93IGVycm9yO1xuXHRcdH1cblxuXHRcdHVuZG9TdGVwcy5wdXNoKCgpID0+XG5cdFx0XHR0aGlzLmdldFJ1bnRpbWUoKVxuXHRcdFx0XHQuc3RvcFJ1bnRpbWUoYXBwLmdldFJ1bnRpbWVDb250cm9sbGVyKCkpXG5cdFx0XHRcdC5jYXRjaCgoKSA9PiB7fSksXG5cdFx0KTtcblxuXHRcdC8vIENyZWF0ZSBhIHVzZXIgZm9yIHRoZSBhcHBcblx0XHR0cnkge1xuXHRcdFx0YXdhaXQgdGhpcy5jcmVhdGVBcHBVc2VyKHJlc3VsdC5pbmZvKTtcblxuXHRcdFx0dW5kb1N0ZXBzLnB1c2goYXN5bmMgKCkgPT4gdm9pZCB0aGlzLnJlbW92ZUFwcFVzZXIoYXBwKSk7XG5cdFx0fSBjYXRjaCB7XG5cdFx0XHRhZmYuc2V0QXBwVXNlckVycm9yKHtcblx0XHRcdFx0dXNlcm5hbWU6IGAke3Jlc3VsdC5pbmZvLm5hbWVTbHVnfS5ib3RgLFxuXHRcdFx0XHRtZXNzYWdlOiAnRmFpbGVkIHRvIGNyZWF0ZSBhbiBhcHAgdXNlciBmb3IgdGhpcyBhcHAuJyxcblx0XHRcdH0pO1xuXG5cdFx0XHRhd2FpdCBQcm9taXNlLmFsbCh1bmRvU3RlcHMubWFwKCh1bmRvZXIpID0+IHVuZG9lcigpKSk7XG5cblx0XHRcdHJldHVybiBhZmY7XG5cdFx0fVxuXG5cdFx0ZGVzY3JpcHRvci5zaWduYXR1cmUgPSBhd2FpdCB0aGlzLmdldFNpZ25hdHVyZU1hbmFnZXIoKS5zaWduQXBwKGRlc2NyaXB0b3IpO1xuXHRcdGNvbnN0IGNyZWF0ZWQgPSBhd2FpdCB0aGlzLmFwcE1ldGFkYXRhU3RvcmFnZS5jcmVhdGUoZGVzY3JpcHRvcik7XG5cblx0XHRpZiAoIWNyZWF0ZWQpIHtcblx0XHRcdGFmZi5zZXRTdG9yYWdlRXJyb3IoJ0ZhaWxlZCB0byBjcmVhdGUgdGhlIEFwcCwgdGhlIHN0b3JhZ2UgZGlkIG5vdCByZXR1cm4gaXQuJyk7XG5cblx0XHRcdGF3YWl0IFByb21pc2UuYWxsKHVuZG9TdGVwcy5tYXAoKHVuZG9lcikgPT4gdW5kb2VyKCkpKTtcblxuXHRcdFx0cmV0dXJuIGFmZjtcblx0XHR9XG5cblx0XHRhcHAuZ2V0U3RvcmFnZUl0ZW0oKS5faWQgPSBjcmVhdGVkLl9pZDtcblxuXHRcdHRoaXMuYXBwcy5zZXQoYXBwLmdldElEKCksIGFwcCk7XG5cdFx0YWZmLnNldEFwcChhcHApO1xuXG5cdFx0Ly8gTGV0IGV2ZXJ5b25lIGtub3cgdGhhdCB0aGUgQXBwIGhhcyBiZWVuIGFkZGVkXG5cdFx0YXdhaXQgdGhpcy5icmlkZ2VzXG5cdFx0XHQuZ2V0QXBwQWN0aXZhdGlvbkJyaWRnZSgpXG5cdFx0XHQuZG9BcHBBZGRlZChhcHApXG5cdFx0XHQuY2F0Y2goKCkgPT4ge1xuXHRcdFx0XHQvLyBJZiBhbiBlcnJvciBvY2N1cnMgZHVyaW5nIHRoaXMsIG9oIHdlbGwuXG5cdFx0XHR9KTtcblxuXHRcdGF3YWl0IHRoaXMuaW5zdGFsbEFwcChhcHAsIHVzZXIpO1xuXG5cdFx0Ly8gU2hvdWxkIGVuYWJsZSA9PT0gdHJ1ZSwgdGhlbiB3ZSBnbyB0aHJvdWdoIHRoZSBlbnRpcmUgc3RhcnQgdXAgcHJvY2Vzc1xuXHRcdC8vIE90aGVyd2lzZSwgd2Ugb25seSBpbml0aWFsaXplIGl0LlxuXHRcdGlmIChlbmFibGUpIHtcblx0XHRcdC8vIFN0YXJ0IHVwIHRoZSBhcHBcblx0XHRcdGF3YWl0IHRoaXMucnVuU3RhcnRVcFByb2Nlc3MoY3JlYXRlZCwgYXBwLCBmYWxzZSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGF3YWl0IHRoaXMuaW5pdGlhbGl6ZUFwcChhcHApO1xuXHRcdH1cblxuXHRcdHJldHVybiBhZmY7XG5cdH1cblxuXHQvKipcblx0ICogVW5pbnN0YWxscyBzcGVjaWZpZWQgYXBwIGZyb20gdGhlIHNlcnZlciBhbmQgcmVtb3ZlXG5cdCAqIGFsbCBkYXRhYmFzZSByZWNvcmRzIHJlZ2FyZGluZyBpdFxuXHQgKlxuXHQgKiBAcmV0dXJucyB0aGUgaW5zdGFuY2Ugb2YgdGhlIHJlbW92ZWQgUHJveGllZEFwcFxuXHQgKi9cblx0cHVibGljIGFzeW5jIHJlbW92ZShpZDogc3RyaW5nLCB1bmluc3RhbGxhdGlvblBhcmFtZXRlcnM6IElBcHBVbmluc3RhbGxQYXJhbWV0ZXJzKTogUHJvbWlzZTxQcm94aWVkQXBwPiB7XG5cdFx0Y29uc3QgYXBwID0gdGhpcy5hcHBzLmdldChpZCk7XG5cdFx0Y29uc3QgeyB1c2VyIH0gPSB1bmluc3RhbGxhdGlvblBhcmFtZXRlcnM7XG5cblx0XHQvLyBGaXJzdCByZW1vdmUgdGhlIGFwcFxuXHRcdGF3YWl0IHRoaXMudW5pbnN0YWxsQXBwKGFwcCwgdXNlcik7XG5cdFx0YXdhaXQgdGhpcy5yZW1vdmVMb2NhbChpZCk7XG5cblx0XHQvLyBUaGVuIGxldCBldmVyeW9uZSBrbm93IHRoYXQgdGhlIEFwcCBoYXMgYmVlbiByZW1vdmVkXG5cdFx0YXdhaXQgdGhpcy5icmlkZ2VzLmdldEFwcEFjdGl2YXRpb25CcmlkZ2UoKS5kb0FwcFJlbW92ZWQoYXBwKS5jYXRjaCgpO1xuXG5cdFx0cmV0dXJuIGFwcDtcblx0fVxuXG5cdC8qKlxuXHQgKiBSZW1vdmVzIHRoZSBhcHAgaW5zdGFuY2UgZnJvbSB0aGUgbG9jYWwgQXBwcyBjb250YWluZXJcblx0ICogYW5kIGV2ZXJ5IHR5cGUgb2YgZGF0YSBhc3NvY2lhdGVkIHdpdGggaXRcblx0ICovXG5cdHB1YmxpYyBhc3luYyByZW1vdmVMb2NhbChpZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3QgYXBwID0gdGhpcy5hcHBzLmdldChpZCk7XG5cblx0XHRpZiAoQXBwU3RhdHVzVXRpbHMuaXNFbmFibGVkKGF3YWl0IGFwcC5nZXRTdGF0dXMoKSkpIHtcblx0XHRcdGF3YWl0IHRoaXMuZGlzYWJsZShpZCk7XG5cdFx0fVxuXG5cdFx0YXdhaXQgdGhpcy5wdXJnZUFwcENvbmZpZyhhcHApO1xuXHRcdHRoaXMubGlzdGVuZXJNYW5hZ2VyLnJlbGVhc2VFc3NlbnRpYWxFdmVudHMoYXBwKTtcblx0XHRhd2FpdCB0aGlzLnJlbW92ZUFwcFVzZXIoYXBwKTtcblx0XHRhd2FpdCAodGhpcy5icmlkZ2VzLmdldFBlcnNpc3RlbmNlQnJpZGdlKCkgYXMgSUludGVybmFsUGVyc2lzdGVuY2VCcmlkZ2UgJiBQZXJzaXN0ZW5jZUJyaWRnZSkucHVyZ2UoYXBwLmdldElEKCkpO1xuXHRcdGF3YWl0IHRoaXMuYXBwTWV0YWRhdGFTdG9yYWdlLnJlbW92ZShhcHAuZ2V0SUQoKSk7XG5cdFx0YXdhaXQgdGhpcy5hcHBTb3VyY2VTdG9yYWdlLnJlbW92ZShhcHAuZ2V0U3RvcmFnZUl0ZW0oKSkuY2F0Y2goKCkgPT4ge30pO1xuXG5cdFx0Ly8gRXJyb3JzIGhlcmUgZG9uJ3QgcmVhbGx5IHByZXZlbnQgdGhlIHByb2Nlc3MgZnJvbSBkeWluZywgc28gd2UgZG9uJ3QgcmVhbGx5IG5lZWQgdG8gZG8gYW55dGhpbmcgb24gdGhlIGNhdGNoXG5cdFx0YXdhaXQgdGhpcy5nZXRSdW50aW1lKClcblx0XHRcdC5zdG9wUnVudGltZShhcHAuZ2V0UnVudGltZUNvbnRyb2xsZXIoKSlcblx0XHRcdC5jYXRjaCgoKSA9PiB7fSk7XG5cblx0XHR0aGlzLmFwcHMuZGVsZXRlKGFwcC5nZXRJRCgpKTtcblx0fVxuXG5cdHB1YmxpYyBhc3luYyB1cGRhdGUoXG5cdFx0YXBwUGFja2FnZTogQnVmZmVyLFxuXHRcdHBlcm1pc3Npb25zR3JhbnRlZDogQXJyYXk8SVBlcm1pc3Npb24+LFxuXHRcdHVwZGF0ZU9wdGlvbnM6IHsgbG9hZEFwcD86IGJvb2xlYW47IHVzZXI/OiBJVXNlciB9ID0geyBsb2FkQXBwOiB0cnVlIH0sXG5cdCk6IFByb21pc2U8QXBwRmFicmljYXRpb25GdWxmaWxsbWVudD4ge1xuXHRcdGNvbnN0IGFmZiA9IG5ldyBBcHBGYWJyaWNhdGlvbkZ1bGZpbGxtZW50KCk7XG5cdFx0Y29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5nZXRQYXJzZXIoKS51bnBhY2thZ2VBcHAoYXBwUGFja2FnZSk7XG5cblx0XHRhZmYuc2V0QXBwSW5mbyhyZXN1bHQuaW5mbyk7XG5cdFx0YWZmLnNldEltcGxlbWVudGVkSW50ZXJmYWNlcyhyZXN1bHQuaW1wbGVtZW50ZWQuZ2V0VmFsdWVzKCkpO1xuXG5cdFx0Y29uc3Qgb2xkID0gYXdhaXQgdGhpcy5hcHBNZXRhZGF0YVN0b3JhZ2UucmV0cmlldmVPbmUocmVzdWx0LmluZm8uaWQpO1xuXG5cdFx0aWYgKCFvbGQpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignQ2FuIG5vdCB1cGRhdGUgYW4gQXBwIHRoYXQgZG9lcyBub3QgY3VycmVudGx5IGV4aXN0LicpO1xuXHRcdH1cblxuXHRcdC8vIElmIHRoZXJlIGlzIGFueSBlcnJvciBkdXJpbmcgZGlzYWJsaW5nLCBpdCBkb2Vzbid0IHJlYWxseSBtYXR0ZXJcblx0XHRhd2FpdCB0aGlzLmRpc2FibGUob2xkLmlkKS5jYXRjaCgoKSA9PiB7fSk7XG5cblx0XHRjb25zdCBkZXNjcmlwdG9yOiBJQXBwU3RvcmFnZUl0ZW0gPSB7XG5cdFx0XHQuLi5vbGQsXG5cdFx0XHRpZDogcmVzdWx0LmluZm8uaWQsXG5cdFx0XHRpbmZvOiByZXN1bHQuaW5mbyxcblx0XHRcdGxhbmd1YWdlQ29udGVudDogcmVzdWx0Lmxhbmd1YWdlQ29udGVudCxcblx0XHRcdGltcGxlbWVudGVkOiByZXN1bHQuaW1wbGVtZW50ZWQuZ2V0VmFsdWVzKCksXG5cdFx0fTtcblxuXHRcdGlmICghcGVybWlzc2lvbnNHcmFudGVkKSB7XG5cdFx0XHRkZWxldGUgZGVzY3JpcHRvci5wZXJtaXNzaW9uc0dyYW50ZWQ7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGRlc2NyaXB0b3IucGVybWlzc2lvbnNHcmFudGVkID0gcGVybWlzc2lvbnNHcmFudGVkO1xuXHRcdH1cblxuXHRcdHRyeSB7XG5cdFx0XHRkZXNjcmlwdG9yLnNvdXJjZVBhdGggPSBhd2FpdCB0aGlzLmFwcFNvdXJjZVN0b3JhZ2UudXBkYXRlKGRlc2NyaXB0b3IsIGFwcFBhY2thZ2UpO1xuXHRcdH0gY2F0Y2gge1xuXHRcdFx0YWZmLnNldFN0b3JhZ2VFcnJvcignRmFpbGVkIHRvIHN0b3JhZ2UgYXBwIHBhY2thZ2UnKTtcblxuXHRcdFx0cmV0dXJuIGFmZjtcblx0XHR9XG5cblx0XHRkZXNjcmlwdG9yLnNpZ25hdHVyZSA9IGF3YWl0IHRoaXMuc2lnbmF0dXJlTWFuYWdlci5zaWduQXBwKGRlc2NyaXB0b3IpO1xuXHRcdGNvbnN0IHN0b3JlZCA9IGF3YWl0IHRoaXMuYXBwTWV0YWRhdGFTdG9yYWdlLnVwZGF0ZVBhcnRpYWxBbmRSZXR1cm5Eb2N1bWVudChkZXNjcmlwdG9yLCB7XG5cdFx0XHR1bnNldFBlcm1pc3Npb25zR3JhbnRlZDogdHlwZW9mIHBlcm1pc3Npb25zR3JhbnRlZCA9PT0gJ3VuZGVmaW5lZCcsXG5cdFx0fSk7XG5cblx0XHQvLyBFcnJvcnMgaGVyZSBkb24ndCByZWFsbHkgcHJldmVudCB0aGUgcHJvY2VzcyBmcm9tIGR5aW5nLCBzbyB3ZSBkb24ndCByZWFsbHkgbmVlZCB0byBkbyBhbnl0aGluZyBvbiB0aGUgY2F0Y2hcblx0XHRhd2FpdCB0aGlzLmdldFJ1bnRpbWUoKVxuXHRcdFx0LnN0b3BSdW50aW1lKHRoaXMuYXBwcy5nZXQob2xkLmlkKS5nZXRSdW50aW1lQ29udHJvbGxlcigpKVxuXHRcdFx0LmNhdGNoKCgpID0+IHt9KTtcblxuXHRcdGNvbnN0IGFwcCA9IGF3YWl0IHRoaXMuZ2V0Q29tcGlsZXIoKS50b1NhbmRCb3godGhpcywgZGVzY3JpcHRvciwgcmVzdWx0KTtcblxuXHRcdC8vIEVuc3VyZSB0aGVyZSBpcyBhbiB1c2VyIGZvciB0aGUgYXBwXG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IHRoaXMuY3JlYXRlQXBwVXNlcihyZXN1bHQuaW5mbyk7XG5cdFx0fSBjYXRjaCB7XG5cdFx0XHRhZmYuc2V0QXBwVXNlckVycm9yKHtcblx0XHRcdFx0dXNlcm5hbWU6IGAke3Jlc3VsdC5pbmZvLm5hbWVTbHVnfS5ib3RgLFxuXHRcdFx0XHRtZXNzYWdlOiAnRmFpbGVkIHRvIGNyZWF0ZSBhbiBhcHAgdXNlciBmb3IgdGhpcyBhcHAuJyxcblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gYWZmO1xuXHRcdH1cblxuXHRcdGFmZi5zZXRBcHAoYXBwKTtcblxuXHRcdGlmICh1cGRhdGVPcHRpb25zLmxvYWRBcHApIHtcblx0XHRcdGNvbnN0IHNob3VsZEVuYWJsZUFwcCA9IEFwcFN0YXR1c1V0aWxzLmlzRW5hYmxlZChvbGQuc3RhdHVzKTtcblx0XHRcdGlmIChzaG91bGRFbmFibGVBcHApIHtcblx0XHRcdFx0YXdhaXQgdGhpcy51cGRhdGVBbmRTdGFydHVwTG9jYWwoc3RvcmVkLCBhcHApO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0YXdhaXQgdGhpcy51cGRhdGVBbmRJbml0aWFsaXplTG9jYWwoc3RvcmVkLCBhcHApO1xuXHRcdFx0fVxuXG5cdFx0XHRhd2FpdCB0aGlzLmJyaWRnZXNcblx0XHRcdFx0LmdldEFwcEFjdGl2YXRpb25CcmlkZ2UoKVxuXHRcdFx0XHQuZG9BcHBVcGRhdGVkKGFwcClcblx0XHRcdFx0LmNhdGNoKCgpID0+IHt9KTtcblx0XHR9XG5cblx0XHRhd2FpdCB0aGlzLnVwZGF0ZUFwcChhcHAsIHVwZGF0ZU9wdGlvbnMudXNlciwgb2xkLmluZm8udmVyc2lvbik7XG5cblx0XHRyZXR1cm4gYWZmO1xuXHR9XG5cblx0LyoqXG5cdCAqIFVwZGF0ZXMgdGhlIGxvY2FsIGluc3RhbmNlIG9mIGFuIGFwcC5cblx0ICpcblx0ICogSWYgdGhlIHNlY29uZCBwYXJhbWV0ZXIgaXMgYSBCdWZmZXIgb2YgYW4gYXBwIHBhY2thZ2UsXG5cdCAqIHVucGFja2FnZSBhbmQgaW5zdGFudGlhdGUgdGhlIGFwcCdzIG1haW4gY2xhc3Ncblx0ICpcblx0ICogV2l0aCBhbiBpbnN0YW5jZSBvZiBhIFByb3hpZWRBcHAsIHN0YXJ0IGl0IHVwIGFuZCByZXBsYWNlXG5cdCAqIHRoZSByZWZlcmVuY2UgaW4gdGhlIGxvY2FsIGFwcCBjb2xsZWN0aW9uXG5cdCAqL1xuXHRhc3luYyB1cGRhdGVMb2NhbChzdG9yZWQ6IElBcHBTdG9yYWdlSXRlbSwgYXBwUGFja2FnZU9ySW5zdGFuY2U6IFByb3hpZWRBcHAgfCBCdWZmZXIpOiBQcm9taXNlPFByb3hpZWRBcHA+IHtcblx0XHRjb25zdCBhcHAgPSBhd2FpdCAoYXN5bmMgKCkgPT4ge1xuXHRcdFx0aWYgKGFwcFBhY2thZ2VPckluc3RhbmNlIGluc3RhbmNlb2YgQnVmZmVyKSB7XG5cdFx0XHRcdGNvbnN0IHBhcnNlUmVzdWx0ID0gYXdhaXQgdGhpcy5nZXRQYXJzZXIoKS51bnBhY2thZ2VBcHAoYXBwUGFja2FnZU9ySW5zdGFuY2UpO1xuXG5cdFx0XHRcdC8vIEVycm9ycyBoZXJlIGRvbid0IHJlYWxseSBwcmV2ZW50IHRoZSBwcm9jZXNzIGZyb20gZHlpbmcsIHNvIHdlIGRvbid0IHJlYWxseSBuZWVkIHRvIGRvIGFueXRoaW5nIG9uIHRoZSBjYXRjaFxuXHRcdFx0XHRhd2FpdCB0aGlzLmdldFJ1bnRpbWUoKVxuXHRcdFx0XHRcdC5zdG9wUnVudGltZSh0aGlzLmFwcHMuZ2V0KHN0b3JlZC5pZCkuZ2V0UnVudGltZUNvbnRyb2xsZXIoKSlcblx0XHRcdFx0XHQuY2F0Y2goKCkgPT4ge30pO1xuXG5cdFx0XHRcdHJldHVybiB0aGlzLmdldENvbXBpbGVyKCkudG9TYW5kQm94KHRoaXMsIHN0b3JlZCwgcGFyc2VSZXN1bHQpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoYXBwUGFja2FnZU9ySW5zdGFuY2UgaW5zdGFuY2VvZiBQcm94aWVkQXBwKSB7XG5cdFx0XHRcdHJldHVybiBhcHBQYWNrYWdlT3JJbnN0YW5jZTtcblx0XHRcdH1cblx0XHR9KSgpO1xuXG5cdFx0Ly8gV2UgZG9uJ3Qga2VlcCBzbGFzaGNvbW1hbmRzIGhlcmUgYXMgdGhlIHVwZGF0ZSBjb3VsZCBwb3RlbnRpYWxseSBub3QgcHJvdmlkZSB0aGUgc2FtZSBsaXN0XG5cdFx0YXdhaXQgdGhpcy5wdXJnZUFwcENvbmZpZyhhcHAsIHsga2VlcFNjaGVkdWxlZEpvYnM6IHRydWUgfSk7XG5cblx0XHR0aGlzLmFwcHMuc2V0KGFwcC5nZXRJRCgpLCBhcHApO1xuXHRcdHJldHVybiBhcHA7XG5cdH1cblxuXHRwdWJsaWMgYXN5bmMgdXBkYXRlQW5kU3RhcnR1cExvY2FsKHN0b3JlZDogSUFwcFN0b3JhZ2VJdGVtLCBhcHBQYWNrYWdlT3JJbnN0YW5jZTogUHJveGllZEFwcCB8IEJ1ZmZlcikge1xuXHRcdGNvbnN0IGFwcCA9IGF3YWl0IHRoaXMudXBkYXRlTG9jYWwoc3RvcmVkLCBhcHBQYWNrYWdlT3JJbnN0YW5jZSk7XG5cdFx0YXdhaXQgdGhpcy5ydW5TdGFydFVwUHJvY2VzcyhzdG9yZWQsIGFwcCwgdHJ1ZSk7XG5cdH1cblxuXHRwdWJsaWMgYXN5bmMgdXBkYXRlQW5kSW5pdGlhbGl6ZUxvY2FsKHN0b3JlZDogSUFwcFN0b3JhZ2VJdGVtLCBhcHBQYWNrYWdlT3JJbnN0YW5jZTogUHJveGllZEFwcCB8IEJ1ZmZlcikge1xuXHRcdGNvbnN0IGFwcCA9IGF3YWl0IHRoaXMudXBkYXRlTG9jYWwoc3RvcmVkLCBhcHBQYWNrYWdlT3JJbnN0YW5jZSk7XG5cdFx0YXdhaXQgdGhpcy5pbml0aWFsaXplQXBwKGFwcCwgdHJ1ZSk7XG5cdH1cblxuXHRwdWJsaWMgZ2V0TGFuZ3VhZ2VDb250ZW50KCk6IHsgW2tleTogc3RyaW5nXTogb2JqZWN0IH0ge1xuXHRcdGNvbnN0IGxhbmdzOiB7IFtrZXk6IHN0cmluZ106IG9iamVjdCB9ID0ge307XG5cblx0XHR0aGlzLmFwcHMuZm9yRWFjaCgocmwpID0+IHtcblx0XHRcdGNvbnN0IGNvbnRlbnQgPSBybC5nZXRTdG9yYWdlSXRlbSgpLmxhbmd1YWdlQ29udGVudDtcblxuXHRcdFx0T2JqZWN0LmtleXMoY29udGVudCkuZm9yRWFjaCgoa2V5KSA9PiB7XG5cdFx0XHRcdGxhbmdzW2tleV0gPSBPYmplY3QuYXNzaWduKGxhbmdzW2tleV0gfHwge30sIGNvbnRlbnRba2V5XSk7XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBsYW5ncztcblx0fVxuXG5cdHB1YmxpYyBhc3luYyBjaGFuZ2VTdGF0dXMoYXBwSWQ6IHN0cmluZywgc3RhdHVzOiBBcHBTdGF0dXMpOiBQcm9taXNlPFByb3hpZWRBcHA+IHtcblx0XHRzd2l0Y2ggKHN0YXR1cykge1xuXHRcdFx0Y2FzZSBBcHBTdGF0dXMuTUFOVUFMTFlfRElTQUJMRUQ6XG5cdFx0XHRjYXNlIEFwcFN0YXR1cy5NQU5VQUxMWV9FTkFCTEVEOlxuXHRcdFx0XHRicmVhaztcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBzdGF0dXMgdG8gY2hhbmdlIGFuIEFwcCB0bywgbXVzdCBiZSBtYW51YWxseSBkaXNhYmxlZCBvciBlbmFibGVkLicpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHJsID0gdGhpcy5hcHBzLmdldChhcHBJZCk7XG5cblx0XHRpZiAoIXJsKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0NhbiBub3QgY2hhbmdlIHRoZSBzdGF0dXMgb2YgYW4gQXBwIHdoaWNoIGRvZXMgbm90IGN1cnJlbnRseSBleGlzdC4nKTtcblx0XHR9XG5cblx0XHRjb25zdCBzdG9yYWdlSXRlbSA9IHJsLmdldFN0b3JhZ2VJdGVtKCk7XG5cblx0XHRpZiAoQXBwU3RhdHVzVXRpbHMuaXNFbmFibGVkKHN0YXR1cykpIHtcblx0XHRcdC8vIFRoZW4gZW5hYmxlIGl0XG5cdFx0XHRpZiAoQXBwU3RhdHVzVXRpbHMuaXNFbmFibGVkKGF3YWl0IHJsLmdldFN0YXR1cygpKSkge1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0NhbiBub3QgZW5hYmxlIGFuIEFwcCB3aGljaCBpcyBhbHJlYWR5IGVuYWJsZWQuJyk7XG5cdFx0XHR9XG5cblx0XHRcdGF3YWl0IHRoaXMuZW5hYmxlKHJsLmdldElEKCkpO1xuXG5cdFx0XHRzdG9yYWdlSXRlbS5zdGF0dXMgPSBBcHBTdGF0dXMuTUFOVUFMTFlfRU5BQkxFRDtcblx0XHRcdGF3YWl0IHRoaXMuYXBwTWV0YWRhdGFTdG9yYWdlLnVwZGF0ZVN0YXR1cyhzdG9yYWdlSXRlbS5faWQsIEFwcFN0YXR1cy5NQU5VQUxMWV9FTkFCTEVEKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYgKCFBcHBTdGF0dXNVdGlscy5pc0VuYWJsZWQoYXdhaXQgcmwuZ2V0U3RhdHVzKCkpKSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcignQ2FuIG5vdCBkaXNhYmxlIGFuIEFwcCB3aGljaCBpcyBub3QgZW5hYmxlZC4nKTtcblx0XHRcdH1cblxuXHRcdFx0YXdhaXQgdGhpcy5kaXNhYmxlKHJsLmdldElEKCksIEFwcFN0YXR1cy5NQU5VQUxMWV9ESVNBQkxFRCk7XG5cblx0XHRcdHN0b3JhZ2VJdGVtLnN0YXR1cyA9IEFwcFN0YXR1cy5NQU5VQUxMWV9ESVNBQkxFRDtcblx0XHRcdGF3YWl0IHRoaXMuYXBwTWV0YWRhdGFTdG9yYWdlLnVwZGF0ZVN0YXR1cyhzdG9yYWdlSXRlbS5faWQsIEFwcFN0YXR1cy5NQU5VQUxMWV9ESVNBQkxFRCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJsO1xuXHR9XG5cblx0cHVibGljIGFzeW5jIHVwZGF0ZUFwcHNNYXJrZXRwbGFjZUluZm8oYXBwc092ZXJ2aWV3OiBBcnJheTx7IGxhdGVzdDogSU1hcmtldHBsYWNlSW5mbyB9Pik6IFByb21pc2U8dm9pZD4ge1xuXHRcdGF3YWl0IFByb21pc2UuYWxsKFxuXHRcdFx0YXBwc092ZXJ2aWV3Lm1hcChhc3luYyAoeyBsYXRlc3Q6IGFwcEluZm8gfSkgPT4ge1xuXHRcdFx0XHRpZiAoIWFwcEluZm8uc3Vic2NyaXB0aW9uSW5mbykge1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNvbnN0IGFwcCA9IHRoaXMuYXBwcy5nZXQoYXBwSW5mby5pZCk7XG5cblx0XHRcdFx0aWYgKCFhcHApIHtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zdCBhcHBTdG9yYWdlSXRlbSA9IGFwcC5nZXRTdG9yYWdlSXRlbSgpO1xuXHRcdFx0XHRjb25zdCB7IHN1YnNjcmlwdGlvbkluZm8gfSA9IGFwcFN0b3JhZ2VJdGVtLm1hcmtldHBsYWNlSW5mbz8uWzBdIHx8IHt9O1xuXG5cdFx0XHRcdGlmIChzdWJzY3JpcHRpb25JbmZvPy5saWNlbnNlLmxpY2Vuc2UgPT09IGFwcEluZm8uc3Vic2NyaXB0aW9uSW5mby5saWNlbnNlLmxpY2Vuc2UpIHtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRhcHBTdG9yYWdlSXRlbS5tYXJrZXRwbGFjZUluZm9bMF0uc3Vic2NyaXB0aW9uSW5mbyA9IGFwcEluZm8uc3Vic2NyaXB0aW9uSW5mbztcblx0XHRcdFx0YXBwU3RvcmFnZUl0ZW0uc2lnbmF0dXJlID0gYXdhaXQgdGhpcy5nZXRTaWduYXR1cmVNYW5hZ2VyKCkuc2lnbkFwcChhcHBTdG9yYWdlSXRlbSk7XG5cblx0XHRcdFx0cmV0dXJuIHRoaXMuYXBwTWV0YWRhdGFTdG9yYWdlLnVwZGF0ZVBhcnRpYWxBbmRSZXR1cm5Eb2N1bWVudCh7XG5cdFx0XHRcdFx0X2lkOiBhcHBTdG9yYWdlSXRlbS5faWQsXG5cdFx0XHRcdFx0bWFya2V0cGxhY2VJbmZvOiBhcHBTdG9yYWdlSXRlbS5tYXJrZXRwbGFjZUluZm8sXG5cdFx0XHRcdFx0c2lnbmF0dXJlOiBhcHBTdG9yYWdlSXRlbS5zaWduYXR1cmUsXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSksXG5cdFx0KS5jYXRjaCgoKSA9PiB7fSk7XG5cblx0XHRjb25zdCBxdWV1ZSA9IFtdIGFzIEFycmF5PFByb21pc2U8dm9pZD4+O1xuXG5cdFx0dGhpcy5hcHBzLmZvckVhY2goKGFwcCkgPT5cblx0XHRcdHF1ZXVlLnB1c2goXG5cdFx0XHRcdGFwcFxuXHRcdFx0XHRcdC52YWxpZGF0ZUxpY2Vuc2UoKVxuXHRcdFx0XHRcdC50aGVuKGFzeW5jICgpID0+IHtcblx0XHRcdFx0XHRcdGlmICgoYXdhaXQgYXBwLmdldFN0YXR1cygpKSAhPT0gQXBwU3RhdHVzLklOVkFMSURfTElDRU5TRV9ESVNBQkxFRCkge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHJldHVybiBhcHAuc2V0U3RhdHVzKEFwcFN0YXR1cy5ESVNBQkxFRCk7XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQuY2F0Y2goYXN5bmMgKGVycm9yKSA9PiB7XG5cdFx0XHRcdFx0XHRpZiAoIShlcnJvciBpbnN0YW5jZW9mIEludmFsaWRMaWNlbnNlRXJyb3IpKSB7XG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuXHRcdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGF3YWl0IHRoaXMucHVyZ2VBcHBDb25maWcoYXBwLCB7IGtlZXBTY2hlZHVsZWRKb2JzOiB0cnVlIH0pO1xuXG5cdFx0XHRcdFx0XHRyZXR1cm4gYXBwLnNldFN0YXR1cyhBcHBTdGF0dXMuSU5WQUxJRF9MSUNFTlNFX0RJU0FCTEVEKTtcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdC50aGVuKGFzeW5jICgpID0+IHtcblx0XHRcdFx0XHRcdGNvbnN0IHN0YXR1cyA9IGF3YWl0IGFwcC5nZXRTdGF0dXMoKTtcblx0XHRcdFx0XHRcdGlmIChzdGF0dXMgPT09IGFwcC5nZXRQcmV2aW91c1N0YXR1cygpKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0Y29uc3Qgc3RvcmFnZUl0ZW0gPSBhcHAuZ2V0U3RvcmFnZUl0ZW0oKTtcblx0XHRcdFx0XHRcdHN0b3JhZ2VJdGVtLnN0YXR1cyA9IHN0YXR1cztcblxuXHRcdFx0XHRcdFx0cmV0dXJuIHRoaXMuYXBwTWV0YWRhdGFTdG9yYWdlLnVwZGF0ZVN0YXR1cyhzdG9yYWdlSXRlbS5faWQsIHN0b3JhZ2VJdGVtLnN0YXR1cykuY2F0Y2goY29uc29sZS5lcnJvcikgYXMgUHJvbWlzZTx2b2lkPjtcblx0XHRcdFx0XHR9KSxcblx0XHRcdCksXG5cdFx0KTtcblxuXHRcdGF3YWl0IFByb21pc2UuYWxsKHF1ZXVlKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBHb2VzIHRocm91Z2ggdGhlIGVudGlyZSBsb2FkaW5nIHVwIHByb2Nlc3MuXG5cdCAqXG5cdCAqIEBwYXJhbSBhcHBJZCB0aGUgaWQgb2YgdGhlIGFwcGxpY2F0aW9uIHRvIGxvYWRcblx0ICovXG5cdHB1YmxpYyBhc3luYyBsb2FkT25lKGFwcElkOiBzdHJpbmcsIHNpbGVuY2VTdGF0dXMgPSBmYWxzZSk6IFByb21pc2U8UHJveGllZEFwcD4ge1xuXHRcdGNvbnN0IHJsID0gdGhpcy5hcHBzLmdldChhcHBJZCk7XG5cblx0XHRpZiAoIXJsKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYE5vIEFwcCBmb3VuZCBieSB0aGUgaWQgb2Y6IFwiJHthcHBJZH1cImApO1xuXHRcdH1cblxuXHRcdGNvbnN0IGl0ZW0gPSBybC5nZXRTdG9yYWdlSXRlbSgpO1xuXG5cdFx0YXdhaXQgdGhpcy5pbml0aWFsaXplQXBwKHJsLCBzaWxlbmNlU3RhdHVzKTtcblxuXHRcdGlmICghdGhpcy5hcmVSZXF1aXJlZFNldHRpbmdzU2V0KGl0ZW0pKSB7XG5cdFx0XHRhd2FpdCBybC5zZXRTdGF0dXMoQXBwU3RhdHVzLklOVkFMSURfU0VUVElOR1NfRElTQUJMRUQpO1xuXHRcdH1cblxuXHRcdGlmICghQXBwU3RhdHVzVXRpbHMuaXNEaXNhYmxlZChhd2FpdCBybC5nZXRTdGF0dXMoKSkgJiYgQXBwU3RhdHVzVXRpbHMuaXNFbmFibGVkKHJsLmdldFByZXZpb3VzU3RhdHVzKCkpKSB7XG5cdFx0XHRhd2FpdCB0aGlzLmVuYWJsZUFwcChybCwgc2lsZW5jZVN0YXR1cyk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMuYXBwcy5nZXQoaXRlbS5pZCk7XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHJ1blN0YXJ0VXBQcm9jZXNzKHN0b3JhZ2VJdGVtOiBJQXBwU3RvcmFnZUl0ZW0sIGFwcDogUHJveGllZEFwcCwgc2lsZW5jZVN0YXR1czogYm9vbGVhbik6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdGlmICgoYXdhaXQgYXBwLmdldFN0YXR1cygpKSAhPT0gQXBwU3RhdHVzLklOSVRJQUxJWkVEKSB7XG5cdFx0XHRjb25zdCBpc0luaXRpYWxpemVkID0gYXdhaXQgdGhpcy5pbml0aWFsaXplQXBwKGFwcCwgc2lsZW5jZVN0YXR1cyk7XG5cdFx0XHRpZiAoIWlzSW5pdGlhbGl6ZWQpIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmICghdGhpcy5hcmVSZXF1aXJlZFNldHRpbmdzU2V0KHN0b3JhZ2VJdGVtKSkge1xuXHRcdFx0YXdhaXQgYXBwLnNldFN0YXR1cyhBcHBTdGF0dXMuSU5WQUxJRF9TRVRUSU5HU19ESVNBQkxFRCwgc2lsZW5jZVN0YXR1cyk7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMuZW5hYmxlQXBwKGFwcCwgc2lsZW5jZVN0YXR1cyk7XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGluc3RhbGxBcHAoYXBwOiBQcm94aWVkQXBwLCB1c2VyOiBJVXNlcik6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdGxldCByZXN1bHQ6IGJvb2xlYW47XG5cdFx0Y29uc3QgY29udGV4dCA9IHsgdXNlciB9O1xuXG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IGFwcC5jYWxsKEFwcE1ldGhvZC5PTklOU1RBTEwsIGNvbnRleHQpO1xuXG5cdFx0XHRyZXN1bHQgPSB0cnVlO1xuXHRcdH0gY2F0Y2gge1xuXHRcdFx0Y29uc3Qgc3RhdHVzID0gQXBwU3RhdHVzLkVSUk9SX0RJU0FCTEVEO1xuXG5cdFx0XHRyZXN1bHQgPSBmYWxzZTtcblxuXHRcdFx0YXdhaXQgYXBwLnNldFN0YXR1cyhzdGF0dXMpO1xuXHRcdH1cblxuXHRcdHJldHVybiByZXN1bHQ7XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHVwZGF0ZUFwcChhcHA6IFByb3hpZWRBcHAsIHVzZXI6IElVc2VyIHwgbnVsbCwgb2xkQXBwVmVyc2lvbjogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG5cdFx0bGV0IHJlc3VsdDogYm9vbGVhbjtcblxuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCBhcHAuY2FsbChBcHBNZXRob2QuT05VUERBVEUsIHsgb2xkQXBwVmVyc2lvbiwgdXNlciB9KTtcblxuXHRcdFx0cmVzdWx0ID0gdHJ1ZTtcblx0XHR9IGNhdGNoIHtcblx0XHRcdGNvbnN0IHN0YXR1cyA9IEFwcFN0YXR1cy5FUlJPUl9ESVNBQkxFRDtcblxuXHRcdFx0cmVzdWx0ID0gZmFsc2U7XG5cblx0XHRcdGF3YWl0IGFwcC5zZXRTdGF0dXMoc3RhdHVzKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gcmVzdWx0O1xuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBpbml0aWFsaXplQXBwKGFwcDogUHJveGllZEFwcCwgc2lsZW5jZVN0YXR1cyA9IGZhbHNlKTogUHJvbWlzZTxib29sZWFuPiB7XG5cdFx0bGV0IHJlc3VsdDogYm9vbGVhbjtcblxuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCBhcHAudmFsaWRhdGVMaWNlbnNlKCk7XG5cdFx0XHRhd2FpdCBhcHAudmFsaWRhdGVJbnN0YWxsYXRpb24oKTtcblxuXHRcdFx0YXdhaXQgYXBwLmNhbGwoQXBwTWV0aG9kLklOSVRJQUxJWkUpO1xuXHRcdFx0YXdhaXQgYXBwLnNldFN0YXR1cyhBcHBTdGF0dXMuSU5JVElBTElaRUQsIHNpbGVuY2VTdGF0dXMpO1xuXG5cdFx0XHRhd2FpdCB0aGlzLmNvbW1hbmRNYW5hZ2VyLnJlZ2lzdGVyQ29tbWFuZHMoYXBwLmdldElEKCkpO1xuXG5cdFx0XHRyZXN1bHQgPSB0cnVlO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGxldCBzdGF0dXMgPSBBcHBTdGF0dXMuRVJST1JfRElTQUJMRUQ7XG5cblx0XHRcdGlmIChlIGluc3RhbmNlb2YgSW52YWxpZExpY2Vuc2VFcnJvcikge1xuXHRcdFx0XHRzdGF0dXMgPSBBcHBTdGF0dXMuSU5WQUxJRF9MSUNFTlNFX0RJU0FCTEVEO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZSBpbnN0YW5jZW9mIEludmFsaWRJbnN0YWxsYXRpb25FcnJvcikge1xuXHRcdFx0XHRzdGF0dXMgPSBBcHBTdGF0dXMuSU5WQUxJRF9JTlNUQUxMQVRJT05fRElTQUJMRUQ7XG5cdFx0XHR9XG5cblx0XHRcdGF3YWl0IHRoaXMucHVyZ2VBcHBDb25maWcoYXBwKTtcblx0XHRcdHJlc3VsdCA9IGZhbHNlO1xuXG5cdFx0XHRhd2FpdCBhcHAuc2V0U3RhdHVzKHN0YXR1cywgc2lsZW5jZVN0YXR1cyk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgcHVyZ2VBcHBDb25maWcoYXBwOiBQcm94aWVkQXBwLCBvcHRzOiBJUHVyZ2VBcHBDb25maWdPcHRzID0ge30pIHtcblx0XHRpZiAoIW9wdHMua2VlcFNjaGVkdWxlZEpvYnMpIHtcblx0XHRcdGF3YWl0IHRoaXMuc2NoZWR1bGVyTWFuYWdlci5jbGVhblVwKGFwcC5nZXRJRCgpKTtcblx0XHR9XG5cblx0XHRpZiAoIW9wdHMua2VlcFNsYXNoY29tbWFuZHMpIHtcblx0XHRcdGF3YWl0IHRoaXMuY29tbWFuZE1hbmFnZXIudW5yZWdpc3RlckNvbW1hbmRzKGFwcC5nZXRJRCgpKTtcblx0XHR9XG5cblx0XHR0aGlzLmxpc3RlbmVyTWFuYWdlci51bnJlZ2lzdGVyTGlzdGVuZXJzKGFwcCk7XG5cdFx0dGhpcy5saXN0ZW5lck1hbmFnZXIubG9ja0Vzc2VudGlhbEV2ZW50cyhhcHApO1xuXHRcdHRoaXMuZXh0ZXJuYWxDb21wb25lbnRNYW5hZ2VyLnVucmVnaXN0ZXJFeHRlcm5hbENvbXBvbmVudHMoYXBwLmdldElEKCkpO1xuXHRcdGF3YWl0IHRoaXMuYXBpTWFuYWdlci51bnJlZ2lzdGVyQXBpcyhhcHAuZ2V0SUQoKSk7XG5cdFx0dGhpcy5hY2Nlc3Nvck1hbmFnZXIucHVyaWZ5QXBwKGFwcC5nZXRJRCgpKTtcblx0XHR0aGlzLnVpQWN0aW9uQnV0dG9uTWFuYWdlci5jbGVhckFwcEFjdGlvbkJ1dHRvbnMoYXBwLmdldElEKCkpO1xuXHRcdGF3YWl0IHRoaXMudmlkZW9Db25mUHJvdmlkZXJNYW5hZ2VyLnVucmVnaXN0ZXJQcm92aWRlcnMoYXBwLmdldElEKCkpO1xuXHRcdGF3YWl0IHRoaXMub3V0Ym91bmRDb21tdW5pY2F0aW9uUHJvdmlkZXJNYW5hZ2VyLnVucmVnaXN0ZXJQcm92aWRlcnMoYXBwLmdldElEKCksIHtcblx0XHRcdGtlZXBSZWZlcmVuY2VzOiBvcHRzLmtlZXBPdXRib3VuZENvbW11bmljYXRpb25Qcm92aWRlcnMsXG5cdFx0fSk7XG5cdH1cblxuXHQvKipcblx0ICogRGV0ZXJtaW5lcyBpZiB0aGUgQXBwJ3MgcmVxdWlyZWQgc2V0dGluZ3MgYXJlIHNldCBvciBub3QuXG5cdCAqIFNob3VsZCBhIHBhY2thZ2VWYWx1ZSBiZSBwcm92aWRlZCBhbmQgbm90IGVtcHR5LCB0aGVuIGl0J3MgY29uc2lkZXJlZCBzZXQuXG5cdCAqL1xuXHRwcml2YXRlIGFyZVJlcXVpcmVkU2V0dGluZ3NTZXQoc3RvcmFnZUl0ZW06IElBcHBTdG9yYWdlSXRlbSk6IGJvb2xlYW4ge1xuXHRcdGxldCByZXN1bHQgPSB0cnVlO1xuXG5cdFx0Zm9yIChjb25zdCBzZXRrIG9mIE9iamVjdC5rZXlzKHN0b3JhZ2VJdGVtLnNldHRpbmdzKSkge1xuXHRcdFx0Y29uc3Qgc2V0dCA9IHN0b3JhZ2VJdGVtLnNldHRpbmdzW3NldGtdO1xuXHRcdFx0Ly8gSWYgaXQncyBub3QgcmVxdWlyZWQsIGlnbm9yZVxuXHRcdFx0aWYgKCFzZXR0LnJlcXVpcmVkKSB7XG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoc2V0dC52YWx1ZSAhPT0gJ3VuZGVmaW5lZCcgfHwgc2V0dC5wYWNrYWdlVmFsdWUgIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXN1bHQgPSBmYWxzZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gcmVzdWx0O1xuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBlbmFibGVBcHAoYXBwOiBQcm94aWVkQXBwLCBzaWxlbmNlU3RhdHVzID0gZmFsc2UpOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0XHRsZXQgZW5hYmxlOiBib29sZWFuO1xuXHRcdGxldCBzdGF0dXMgPSBBcHBTdGF0dXMuRVJST1JfRElTQUJMRUQ7XG5cblx0XHR0cnkge1xuXHRcdFx0YXdhaXQgYXBwLnZhbGlkYXRlTGljZW5zZSgpO1xuXHRcdFx0YXdhaXQgYXBwLnZhbGlkYXRlSW5zdGFsbGF0aW9uKCk7XG5cblx0XHRcdGVuYWJsZSA9IChhd2FpdCBhcHAuY2FsbChBcHBNZXRob2QuT05FTkFCTEUpKSBhcyBib29sZWFuO1xuXG5cdFx0XHRpZiAoZW5hYmxlKSB7XG5cdFx0XHRcdHN0YXR1cyA9IEFwcFN0YXR1cy5NQU5VQUxMWV9FTkFCTEVEO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0c3RhdHVzID0gQXBwU3RhdHVzLkRJU0FCTEVEO1xuXHRcdFx0XHRjb25zb2xlLndhcm4oYFRoZSBBcHAgKCR7YXBwLmdldElEKCl9KSBkaXNhYmxlZCBpdHNlbGYgd2hlbiBiZWluZyBlbmFibGVkLiBcXG5DaGVjayB0aGUgXCJvbkVuYWJsZVwiIGltcGxlbWVudGF0aW9uIGZvciBkZXRhaWxzLmApO1xuXHRcdFx0fVxuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGVuYWJsZSA9IGZhbHNlO1xuXG5cdFx0XHRpZiAoZSBpbnN0YW5jZW9mIEludmFsaWRMaWNlbnNlRXJyb3IpIHtcblx0XHRcdFx0c3RhdHVzID0gQXBwU3RhdHVzLklOVkFMSURfTElDRU5TRV9ESVNBQkxFRDtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGUgaW5zdGFuY2VvZiBJbnZhbGlkSW5zdGFsbGF0aW9uRXJyb3IpIHtcblx0XHRcdFx0c3RhdHVzID0gQXBwU3RhdHVzLklOVkFMSURfSU5TVEFMTEFUSU9OX0RJU0FCTEVEO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zb2xlLmVycm9yKGUpO1xuXHRcdH1cblxuXHRcdGlmIChlbmFibGUpIHtcblx0XHRcdHRoaXMuZXh0ZXJuYWxDb21wb25lbnRNYW5hZ2VyLnJlZ2lzdGVyRXh0ZXJuYWxDb21wb25lbnRzKGFwcC5nZXRJRCgpKTtcblx0XHRcdGF3YWl0IHRoaXMuYXBpTWFuYWdlci5yZWdpc3RlckFwaXMoYXBwLmdldElEKCkpO1xuXHRcdFx0dGhpcy5saXN0ZW5lck1hbmFnZXIucmVnaXN0ZXJMaXN0ZW5lcnMoYXBwKTtcblx0XHRcdHRoaXMubGlzdGVuZXJNYW5hZ2VyLnJlbGVhc2VFc3NlbnRpYWxFdmVudHMoYXBwKTtcblx0XHRcdGF3YWl0IHRoaXMudmlkZW9Db25mUHJvdmlkZXJNYW5hZ2VyLnJlZ2lzdGVyUHJvdmlkZXJzKGFwcC5nZXRJRCgpKTtcblx0XHRcdGF3YWl0IHRoaXMub3V0Ym91bmRDb21tdW5pY2F0aW9uUHJvdmlkZXJNYW5hZ2VyLnJlZ2lzdGVyUHJvdmlkZXJzKGFwcC5nZXRJRCgpKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0YXdhaXQgdGhpcy5wdXJnZUFwcENvbmZpZyhhcHAsIHtcblx0XHRcdFx0a2VlcFNjaGVkdWxlZEpvYnM6IHRydWUsXG5cdFx0XHRcdGtlZXBTbGFzaGNvbW1hbmRzOiB0cnVlLFxuXHRcdFx0XHRrZWVwT3V0Ym91bmRDb21tdW5pY2F0aW9uUHJvdmlkZXJzOiB0cnVlLFxuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0YXdhaXQgYXBwLnNldFN0YXR1cyhzdGF0dXMsIHNpbGVuY2VTdGF0dXMpO1xuXG5cdFx0cmV0dXJuIGVuYWJsZTtcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgY3JlYXRlQXBwVXNlcihhcHBJbmZvOiBJQXBwSW5mbyk6IFByb21pc2U8c3RyaW5nPiB7XG5cdFx0Y29uc3QgYXBwVXNlciA9IGF3YWl0ICh0aGlzLmJyaWRnZXMuZ2V0VXNlckJyaWRnZSgpIGFzIElJbnRlcm5hbFVzZXJCcmlkZ2UgJiBVc2VyQnJpZGdlKS5nZXRBcHBVc2VyKGFwcEluZm8uaWQpO1xuXG5cdFx0aWYgKGFwcFVzZXIpIHtcblx0XHRcdHJldHVybiBhcHBVc2VyLmlkO1xuXHRcdH1cblxuXHRcdGNvbnN0IHVzZXJEYXRhOiBQYXJ0aWFsPElVc2VyPiA9IHtcblx0XHRcdHVzZXJuYW1lOiBgJHthcHBJbmZvLm5hbWVTbHVnfS5ib3RgLFxuXHRcdFx0bmFtZTogYXBwSW5mby5uYW1lLFxuXHRcdFx0cm9sZXM6IFsnYXBwJ10sXG5cdFx0XHRhcHBJZDogYXBwSW5mby5pZCxcblx0XHRcdHR5cGU6IFVzZXJUeXBlLkFQUCxcblx0XHRcdHN0YXR1czogJ29ubGluZScsXG5cdFx0XHRpc0VuYWJsZWQ6IHRydWUsXG5cdFx0fTtcblxuXHRcdHJldHVybiAodGhpcy5icmlkZ2VzLmdldFVzZXJCcmlkZ2UoKSBhcyBJSW50ZXJuYWxVc2VyQnJpZGdlICYgVXNlckJyaWRnZSkuY3JlYXRlKHVzZXJEYXRhLCBhcHBJbmZvLmlkLCB7XG5cdFx0XHRhdmF0YXJVcmw6IGFwcEluZm8uaWNvbkZpbGVDb250ZW50IHx8IGFwcEluZm8uaWNvbkZpbGUsXG5cdFx0XHRqb2luRGVmYXVsdENoYW5uZWxzOiB0cnVlLFxuXHRcdFx0c2VuZFdlbGNvbWVFbWFpbDogZmFsc2UsXG5cdFx0fSk7XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHJlbW92ZUFwcFVzZXIoYXBwOiBQcm94aWVkQXBwKTogUHJvbWlzZTxib29sZWFuPiB7XG5cdFx0Y29uc3QgYXBwVXNlciA9IGF3YWl0ICh0aGlzLmJyaWRnZXMuZ2V0VXNlckJyaWRnZSgpIGFzIElJbnRlcm5hbFVzZXJCcmlkZ2UgJiBVc2VyQnJpZGdlKS5nZXRBcHBVc2VyKGFwcC5nZXRJRCgpKTtcblxuXHRcdGlmICghYXBwVXNlcikge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0cmV0dXJuICh0aGlzLmJyaWRnZXMuZ2V0VXNlckJyaWRnZSgpIGFzIElJbnRlcm5hbFVzZXJCcmlkZ2UgJiBVc2VyQnJpZGdlKS5yZW1vdmUoYXBwVXNlciwgYXBwLmdldElEKCkpO1xuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyB1bmluc3RhbGxBcHAoYXBwOiBQcm94aWVkQXBwLCB1c2VyOiBJVXNlcik6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdGxldCByZXN1bHQ6IGJvb2xlYW47XG5cdFx0Y29uc3QgY29udGV4dCA9IHsgdXNlciB9O1xuXG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IGFwcC5jYWxsKEFwcE1ldGhvZC5PTlVOSU5TVEFMTCwgY29udGV4dCk7XG5cblx0XHRcdHJlc3VsdCA9IHRydWU7XG5cdFx0fSBjYXRjaCB7XG5cdFx0XHRjb25zdCBzdGF0dXMgPSBBcHBTdGF0dXMuRVJST1JfRElTQUJMRUQ7XG5cblx0XHRcdHJlc3VsdCA9IGZhbHNlO1xuXG5cdFx0XHRhd2FpdCBhcHAuc2V0U3RhdHVzKHN0YXR1cyk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fVxufVxuXG5leHBvcnQgY29uc3QgZ2V0UGVybWlzc2lvbnNCeUFwcElkID0gKGFwcElkOiBzdHJpbmcpID0+IHtcblx0aWYgKCFBcHBNYW5hZ2VyLkluc3RhbmNlKSB7XG5cdFx0Y29uc29sZS5lcnJvcignQXBwTWFuYWdlciBzaG91bGQgYmUgaW5zdGFudGlhdGVkIGZpcnN0Jyk7XG5cdFx0cmV0dXJuIFtdO1xuXHR9XG5cdHJldHVybiBBcHBNYW5hZ2VyLkluc3RhbmNlLmdldFBlcm1pc3Npb25zQnlJZChhcHBJZCk7XG59O1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsTUFBTSxRQUFRLFNBQVM7QUFHaEMsU0FBUyxVQUFVLFFBQVEsZUFBZTtBQUUxQyxTQUFTLFVBQVUsUUFBUSxZQUFZO0FBQ3ZDLFNBQVMsU0FBUyxFQUFFLGNBQWMsUUFBUSwwQkFBMEI7QUFFcEUsU0FBUyxTQUFTLFFBQVEseUJBQXlCO0FBR25ELFNBQVMsUUFBUSxRQUFRLHNCQUFzQjtBQUcvQyxTQUFTLFdBQVcsRUFBRSx5QkFBeUIsRUFBRSxnQkFBZ0IsUUFBUSxhQUFhO0FBQ3RGLFNBQVMsbUJBQW1CLFFBQVEsV0FBVztBQUMvQyxTQUFTLHdCQUF3QixRQUFRLG9DQUFvQztBQUM3RSxTQUNDLGtCQUFrQixFQUNsQixhQUFhLEVBQ2IsMkJBQTJCLEVBQzNCLGlCQUFpQixFQUNqQixrQkFBa0IsRUFDbEIsbUJBQW1CLEVBQ25CLGtCQUFrQixFQUNsQixzQkFBc0IsRUFDdEIsMkJBQTJCLFFBQ3JCLGFBQWE7QUFDcEIsU0FBUyx1Q0FBdUMsUUFBUSxxREFBcUQ7QUFDN0csU0FBUyxpQkFBaUIsUUFBUSwrQkFBK0I7QUFDakUsU0FBUyxtQkFBbUIsUUFBUSxpQ0FBaUM7QUFDckUsU0FBUyxxQkFBcUIsUUFBUSxtQ0FBbUM7QUFFekUsU0FBUyxrQkFBa0IsUUFBUSwrQkFBK0I7QUFDbEUsU0FBUyxZQUFZLFFBQVEseUJBQXlCO0FB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
// denoCacheMetadata=18357198627157386902,12342885781358211286