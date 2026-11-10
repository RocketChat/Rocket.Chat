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
      app.getRuntimeController().stopApp();
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
    } catch (error) {
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
    } catch (error) {
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
    const storageItem = await rl.getStorageItem();
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
      if (subscriptionInfo && subscriptionInfo.license.license === appInfo.subscriptionInfo.license.license) {
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
    this.videoConfProviderManager.unregisterProviders(app.getID());
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
      this.videoConfProviderManager.registerProviders(app.getID());
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvZ3VpbGhlcm1lZ2F6em8vZGV2L2l1c2VyL3BhY2thZ2VzL2FwcHMtZW5naW5lL3NyYy9zZXJ2ZXIvQXBwTWFuYWdlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBCdWZmZXIgfSBmcm9tICdidWZmZXInO1xuXG5pbXBvcnQgdHlwZSB7IElHZXRBcHBzRmlsdGVyIH0gZnJvbSAnLi9JR2V0QXBwc0ZpbHRlcic7XG5pbXBvcnQgeyBQcm94aWVkQXBwIH0gZnJvbSAnLi9Qcm94aWVkQXBwJztcbmltcG9ydCB0eXBlIHsgUGVyc2lzdGVuY2VCcmlkZ2UsIFVzZXJCcmlkZ2UgfSBmcm9tICcuL2JyaWRnZXMnO1xuaW1wb3J0IHsgQXBwQnJpZGdlcyB9IGZyb20gJy4vYnJpZGdlcyc7XG5pbXBvcnQgeyBBcHBTdGF0dXMsIEFwcFN0YXR1c1V0aWxzIH0gZnJvbSAnLi4vZGVmaW5pdGlvbi9BcHBTdGF0dXMnO1xuaW1wb3J0IHR5cGUgeyBJQXBwSW5mbyB9IGZyb20gJy4uL2RlZmluaXRpb24vbWV0YWRhdGEnO1xuaW1wb3J0IHsgQXBwTWV0aG9kIH0gZnJvbSAnLi4vZGVmaW5pdGlvbi9tZXRhZGF0YSc7XG5pbXBvcnQgdHlwZSB7IElQZXJtaXNzaW9uIH0gZnJvbSAnLi4vZGVmaW5pdGlvbi9wZXJtaXNzaW9ucy9JUGVybWlzc2lvbic7XG5pbXBvcnQgdHlwZSB7IElVc2VyIH0gZnJvbSAnLi4vZGVmaW5pdGlvbi91c2Vycyc7XG5pbXBvcnQgeyBVc2VyVHlwZSB9IGZyb20gJy4uL2RlZmluaXRpb24vdXNlcnMnO1xuaW1wb3J0IHR5cGUgeyBJSW50ZXJuYWxQZXJzaXN0ZW5jZUJyaWRnZSB9IGZyb20gJy4vYnJpZGdlcy9JSW50ZXJuYWxQZXJzaXN0ZW5jZUJyaWRnZSc7XG5pbXBvcnQgdHlwZSB7IElJbnRlcm5hbFVzZXJCcmlkZ2UgfSBmcm9tICcuL2JyaWRnZXMvSUludGVybmFsVXNlckJyaWRnZSc7XG5pbXBvcnQgeyBBcHBDb21waWxlciwgQXBwRmFicmljYXRpb25GdWxmaWxsbWVudCwgQXBwUGFja2FnZVBhcnNlciB9IGZyb20gJy4vY29tcGlsZXInO1xuaW1wb3J0IHsgSW52YWxpZExpY2Vuc2VFcnJvciB9IGZyb20gJy4vZXJyb3JzJztcbmltcG9ydCB7IEludmFsaWRJbnN0YWxsYXRpb25FcnJvciB9IGZyb20gJy4vZXJyb3JzL0ludmFsaWRJbnN0YWxsYXRpb25FcnJvcic7XG5pbXBvcnQge1xuXHRBcHBBY2Nlc3Nvck1hbmFnZXIsXG5cdEFwcEFwaU1hbmFnZXIsXG5cdEFwcEV4dGVybmFsQ29tcG9uZW50TWFuYWdlcixcblx0QXBwTGljZW5zZU1hbmFnZXIsXG5cdEFwcExpc3RlbmVyTWFuYWdlcixcblx0QXBwU2NoZWR1bGVyTWFuYWdlcixcblx0QXBwU2V0dGluZ3NNYW5hZ2VyLFxuXHRBcHBTbGFzaENvbW1hbmRNYW5hZ2VyLFxuXHRBcHBWaWRlb0NvbmZQcm92aWRlck1hbmFnZXIsXG59IGZyb20gJy4vbWFuYWdlcnMnO1xuaW1wb3J0IHsgQXBwT3V0Ym91bmRDb21tdW5pY2F0aW9uUHJvdmlkZXJNYW5hZ2VyIH0gZnJvbSAnLi9tYW5hZ2Vycy9BcHBPdXRib3VuZENvbW11bmljYXRpb25Qcm92aWRlck1hbmFnZXInO1xuaW1wb3J0IHsgQXBwUnVudGltZU1hbmFnZXIgfSBmcm9tICcuL21hbmFnZXJzL0FwcFJ1bnRpbWVNYW5hZ2VyJztcbmltcG9ydCB7IEFwcFNpZ25hdHVyZU1hbmFnZXIgfSBmcm9tICcuL21hbmFnZXJzL0FwcFNpZ25hdHVyZU1hbmFnZXInO1xuaW1wb3J0IHsgVUlBY3Rpb25CdXR0b25NYW5hZ2VyIH0gZnJvbSAnLi9tYW5hZ2Vycy9VSUFjdGlvbkJ1dHRvbk1hbmFnZXInO1xuaW1wb3J0IHR5cGUgeyBJTWFya2V0cGxhY2VJbmZvIH0gZnJvbSAnLi9tYXJrZXRwbGFjZSc7XG5pbXBvcnQgeyBkZWZhdWx0UGVybWlzc2lvbnMgfSBmcm9tICcuL3Blcm1pc3Npb25zL0FwcFBlcm1pc3Npb25zJztcbmltcG9ydCB7IEVtcHR5UnVudGltZSB9IGZyb20gJy4vcnVudGltZS9FbXB0eVJ1bnRpbWUnO1xuaW1wb3J0IHR5cGUgeyBJQXBwU3RvcmFnZUl0ZW0gfSBmcm9tICcuL3N0b3JhZ2UnO1xuaW1wb3J0IHsgQXBwTG9nU3RvcmFnZSwgQXBwTWV0YWRhdGFTdG9yYWdlIH0gZnJvbSAnLi9zdG9yYWdlJztcbmltcG9ydCB7IEFwcFNvdXJjZVN0b3JhZ2UgfSBmcm9tICcuL3N0b3JhZ2UvQXBwU291cmNlU3RvcmFnZSc7XG5pbXBvcnQgeyBBcHBJbnN0YWxsYXRpb25Tb3VyY2UgfSBmcm9tICcuL3N0b3JhZ2UvSUFwcFN0b3JhZ2VJdGVtJztcblxuZXhwb3J0IGludGVyZmFjZSBJQXBwSW5zdGFsbFBhcmFtZXRlcnMge1xuXHRlbmFibGU6IGJvb2xlYW47XG5cdG1hcmtldHBsYWNlSW5mbz86IElNYXJrZXRwbGFjZUluZm9bXTtcblx0cGVybWlzc2lvbnNHcmFudGVkPzogQXJyYXk8SVBlcm1pc3Npb24+O1xuXHR1c2VyOiBJVXNlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJQXBwVW5pbnN0YWxsUGFyYW1ldGVycyB7XG5cdHVzZXI6IElVc2VyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElBcHBNYW5hZ2VyRGVwcyB7XG5cdG1ldGFkYXRhU3RvcmFnZTogQXBwTWV0YWRhdGFTdG9yYWdlO1xuXHRsb2dTdG9yYWdlOiBBcHBMb2dTdG9yYWdlO1xuXHRicmlkZ2VzOiBBcHBCcmlkZ2VzO1xuXHRzb3VyY2VTdG9yYWdlOiBBcHBTb3VyY2VTdG9yYWdlO1xuXHQvKipcblx0ICogUGF0aCB0byB0ZW1wb3JhcnkgZmlsZSBzdG9yYWdlLlxuXHQgKlxuXHQgKiBOZWVkcyB0byBiZSBhY2Nlc3NpYmxlIGZvciByZWFkaW5nIGFuZCB3cml0aW5nLlxuXHQgKi9cblx0dGVtcEZpbGVQYXRoOiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBJUHVyZ2VBcHBDb25maWdPcHRzIHtcblx0a2VlcFNjaGVkdWxlZEpvYnM/OiBib29sZWFuO1xuXHRrZWVwU2xhc2hjb21tYW5kcz86IGJvb2xlYW47XG5cdGtlZXBPdXRib3VuZENvbW11bmljYXRpb25Qcm92aWRlcnM/OiBib29sZWFuO1xufVxuXG5leHBvcnQgY2xhc3MgQXBwTWFuYWdlciB7XG5cdHB1YmxpYyBzdGF0aWMgSW5zdGFuY2U6IEFwcE1hbmFnZXI7XG5cblx0Ly8gYXBwcyBjb250YWlucyBhbGwgb2YgdGhlIEFwcHNcblx0cHJpdmF0ZSByZWFkb25seSBhcHBzOiBNYXA8c3RyaW5nLCBQcm94aWVkQXBwPjtcblxuXHRwcml2YXRlIHJlYWRvbmx5IGFwcE1ldGFkYXRhU3RvcmFnZTogQXBwTWV0YWRhdGFTdG9yYWdlO1xuXG5cdHByaXZhdGUgYXBwU291cmNlU3RvcmFnZTogQXBwU291cmNlU3RvcmFnZTtcblxuXHRwcml2YXRlIHJlYWRvbmx5IGxvZ1N0b3JhZ2U6IEFwcExvZ1N0b3JhZ2U7XG5cblx0cHJpdmF0ZSByZWFkb25seSBicmlkZ2VzOiBBcHBCcmlkZ2VzO1xuXG5cdHByaXZhdGUgcmVhZG9ubHkgcGFyc2VyOiBBcHBQYWNrYWdlUGFyc2VyO1xuXG5cdHByaXZhdGUgcmVhZG9ubHkgY29tcGlsZXI6IEFwcENvbXBpbGVyO1xuXG5cdHByaXZhdGUgcmVhZG9ubHkgYWNjZXNzb3JNYW5hZ2VyOiBBcHBBY2Nlc3Nvck1hbmFnZXI7XG5cblx0cHJpdmF0ZSByZWFkb25seSBsaXN0ZW5lck1hbmFnZXI6IEFwcExpc3RlbmVyTWFuYWdlcjtcblxuXHRwcml2YXRlIHJlYWRvbmx5IGNvbW1hbmRNYW5hZ2VyOiBBcHBTbGFzaENvbW1hbmRNYW5hZ2VyO1xuXG5cdHByaXZhdGUgcmVhZG9ubHkgYXBpTWFuYWdlcjogQXBwQXBpTWFuYWdlcjtcblxuXHRwcml2YXRlIHJlYWRvbmx5IGV4dGVybmFsQ29tcG9uZW50TWFuYWdlcjogQXBwRXh0ZXJuYWxDb21wb25lbnRNYW5hZ2VyO1xuXG5cdHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3NNYW5hZ2VyOiBBcHBTZXR0aW5nc01hbmFnZXI7XG5cblx0cHJpdmF0ZSByZWFkb25seSBsaWNlbnNlTWFuYWdlcjogQXBwTGljZW5zZU1hbmFnZXI7XG5cblx0cHJpdmF0ZSByZWFkb25seSBzY2hlZHVsZXJNYW5hZ2VyOiBBcHBTY2hlZHVsZXJNYW5hZ2VyO1xuXG5cdHByaXZhdGUgcmVhZG9ubHkgdWlBY3Rpb25CdXR0b25NYW5hZ2VyOiBVSUFjdGlvbkJ1dHRvbk1hbmFnZXI7XG5cblx0cHJpdmF0ZSByZWFkb25seSB2aWRlb0NvbmZQcm92aWRlck1hbmFnZXI6IEFwcFZpZGVvQ29uZlByb3ZpZGVyTWFuYWdlcjtcblxuXHRwcml2YXRlIHJlYWRvbmx5IG91dGJvdW5kQ29tbXVuaWNhdGlvblByb3ZpZGVyTWFuYWdlcjogQXBwT3V0Ym91bmRDb21tdW5pY2F0aW9uUHJvdmlkZXJNYW5hZ2VyO1xuXG5cdHByaXZhdGUgcmVhZG9ubHkgc2lnbmF0dXJlTWFuYWdlcjogQXBwU2lnbmF0dXJlTWFuYWdlcjtcblxuXHRwcml2YXRlIHJlYWRvbmx5IHJ1bnRpbWU6IEFwcFJ1bnRpbWVNYW5hZ2VyO1xuXG5cdHByaXZhdGUgcmVhZG9ubHkgdGVtcEZpbGVQYXRoOiBzdHJpbmc7XG5cblx0cHJpdmF0ZSBpc0xvYWRlZDogYm9vbGVhbjtcblxuXHRjb25zdHJ1Y3Rvcih7IG1ldGFkYXRhU3RvcmFnZSwgbG9nU3RvcmFnZSwgYnJpZGdlcywgc291cmNlU3RvcmFnZSwgdGVtcEZpbGVQYXRoIH06IElBcHBNYW5hZ2VyRGVwcykge1xuXHRcdC8vIFNpbmdsZXRvbiBzdHlsZS4gVGhlcmUgY2FuIG9ubHkgZXZlciBiZSBvbmUgQXBwTWFuYWdlciBpbnN0YW5jZVxuXHRcdGlmICh0eXBlb2YgQXBwTWFuYWdlci5JbnN0YW5jZSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignVGhlcmUgaXMgYWxyZWFkeSBhIHZhbGlkIEFwcE1hbmFnZXIgaW5zdGFuY2UnKTtcblx0XHR9XG5cblx0XHRpZiAobWV0YWRhdGFTdG9yYWdlIGluc3RhbmNlb2YgQXBwTWV0YWRhdGFTdG9yYWdlKSB7XG5cdFx0XHR0aGlzLmFwcE1ldGFkYXRhU3RvcmFnZSA9IG1ldGFkYXRhU3RvcmFnZTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGluc3RhbmNlIG9mIHRoZSBBcHBNZXRhZGF0YVN0b3JhZ2UnKTtcblx0XHR9XG5cblx0XHRpZiAobG9nU3RvcmFnZSBpbnN0YW5jZW9mIEFwcExvZ1N0b3JhZ2UpIHtcblx0XHRcdHRoaXMubG9nU3RvcmFnZSA9IGxvZ1N0b3JhZ2U7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBpbnN0YW5jZSBvZiB0aGUgQXBwTG9nU3RvcmFnZScpO1xuXHRcdH1cblxuXHRcdGlmIChicmlkZ2VzIGluc3RhbmNlb2YgQXBwQnJpZGdlcykge1xuXHRcdFx0dGhpcy5icmlkZ2VzID0gYnJpZGdlcztcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGluc3RhbmNlIG9mIHRoZSBBcHBCcmlkZ2VzJyk7XG5cdFx0fVxuXG5cdFx0aWYgKHNvdXJjZVN0b3JhZ2UgaW5zdGFuY2VvZiBBcHBTb3VyY2VTdG9yYWdlKSB7XG5cdFx0XHR0aGlzLmFwcFNvdXJjZVN0b3JhZ2UgPSBzb3VyY2VTdG9yYWdlO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgaW5zdGFuY2Ugb2YgdGhlIEFwcFNvdXJjZVN0b3JhZ2UnKTtcblx0XHR9XG5cblx0XHR0aGlzLnRlbXBGaWxlUGF0aCA9IHRlbXBGaWxlUGF0aDtcblxuXHRcdHRoaXMuYXBwcyA9IG5ldyBNYXA8c3RyaW5nLCBQcm94aWVkQXBwPigpO1xuXG5cdFx0dGhpcy5wYXJzZXIgPSBuZXcgQXBwUGFja2FnZVBhcnNlcigpO1xuXHRcdHRoaXMuY29tcGlsZXIgPSBuZXcgQXBwQ29tcGlsZXIoKTtcblx0XHR0aGlzLmFjY2Vzc29yTWFuYWdlciA9IG5ldyBBcHBBY2Nlc3Nvck1hbmFnZXIodGhpcyk7XG5cdFx0dGhpcy5saXN0ZW5lck1hbmFnZXIgPSBuZXcgQXBwTGlzdGVuZXJNYW5hZ2VyKHRoaXMpO1xuXHRcdHRoaXMuY29tbWFuZE1hbmFnZXIgPSBuZXcgQXBwU2xhc2hDb21tYW5kTWFuYWdlcih0aGlzKTtcblx0XHR0aGlzLmFwaU1hbmFnZXIgPSBuZXcgQXBwQXBpTWFuYWdlcih0aGlzKTtcblx0XHR0aGlzLmV4dGVybmFsQ29tcG9uZW50TWFuYWdlciA9IG5ldyBBcHBFeHRlcm5hbENvbXBvbmVudE1hbmFnZXIoKTtcblx0XHR0aGlzLnNldHRpbmdzTWFuYWdlciA9IG5ldyBBcHBTZXR0aW5nc01hbmFnZXIodGhpcyk7XG5cdFx0dGhpcy5saWNlbnNlTWFuYWdlciA9IG5ldyBBcHBMaWNlbnNlTWFuYWdlcih0aGlzKTtcblx0XHR0aGlzLnNjaGVkdWxlck1hbmFnZXIgPSBuZXcgQXBwU2NoZWR1bGVyTWFuYWdlcih0aGlzKTtcblx0XHR0aGlzLnVpQWN0aW9uQnV0dG9uTWFuYWdlciA9IG5ldyBVSUFjdGlvbkJ1dHRvbk1hbmFnZXIodGhpcyk7XG5cdFx0dGhpcy52aWRlb0NvbmZQcm92aWRlck1hbmFnZXIgPSBuZXcgQXBwVmlkZW9Db25mUHJvdmlkZXJNYW5hZ2VyKHRoaXMpO1xuXHRcdHRoaXMub3V0Ym91bmRDb21tdW5pY2F0aW9uUHJvdmlkZXJNYW5hZ2VyID0gbmV3IEFwcE91dGJvdW5kQ29tbXVuaWNhdGlvblByb3ZpZGVyTWFuYWdlcih0aGlzKTtcblx0XHR0aGlzLnNpZ25hdHVyZU1hbmFnZXIgPSBuZXcgQXBwU2lnbmF0dXJlTWFuYWdlcih0aGlzKTtcblx0XHR0aGlzLnJ1bnRpbWUgPSBuZXcgQXBwUnVudGltZU1hbmFnZXIodGhpcyk7XG5cblx0XHR0aGlzLmlzTG9hZGVkID0gZmFsc2U7XG5cdFx0QXBwTWFuYWdlci5JbnN0YW5jZSA9IHRoaXM7XG5cdH1cblxuXHQvKipcblx0ICogR2V0cyB0aGUgcGF0aCB0byB0aGUgdGVtcG9yYXJ5IGZpbGUgc3RvcmFnZS5cblx0ICpcblx0ICogTWFpbmx5IHVzZWQgZm9yIHVwbG9hZCBldmVudHNcblx0ICovXG5cdHB1YmxpYyBnZXRUZW1wRmlsZVBhdGgoKTogc3RyaW5nIHtcblx0XHRyZXR1cm4gdGhpcy50ZW1wRmlsZVBhdGg7XG5cdH1cblxuXHQvKiogR2V0cyB0aGUgaW5zdGFuY2Ugb2YgdGhlIHN0b3JhZ2UgY29ubmVjdG9yLiAqL1xuXHRwdWJsaWMgZ2V0U3RvcmFnZSgpOiBBcHBNZXRhZGF0YVN0b3JhZ2Uge1xuXHRcdHJldHVybiB0aGlzLmFwcE1ldGFkYXRhU3RvcmFnZTtcblx0fVxuXG5cdC8qKiBHZXRzIHRoZSBpbnN0YW5jZSBvZiB0aGUgbG9nIHN0b3JhZ2UgY29ubmVjdG9yLiAqL1xuXHRwdWJsaWMgZ2V0TG9nU3RvcmFnZSgpOiBBcHBMb2dTdG9yYWdlIHtcblx0XHRyZXR1cm4gdGhpcy5sb2dTdG9yYWdlO1xuXHR9XG5cblx0LyoqIEdldHMgdGhlIGluc3RhbmNlIG9mIHRoZSBBcHAgcGFja2FnZSBwYXJzZXIuICovXG5cdHB1YmxpYyBnZXRQYXJzZXIoKTogQXBwUGFja2FnZVBhcnNlciB7XG5cdFx0cmV0dXJuIHRoaXMucGFyc2VyO1xuXHR9XG5cblx0LyoqIEdldHMgdGhlIGNvbXBpbGVyIGluc3RhbmNlLiAqL1xuXHRwdWJsaWMgZ2V0Q29tcGlsZXIoKTogQXBwQ29tcGlsZXIge1xuXHRcdHJldHVybiB0aGlzLmNvbXBpbGVyO1xuXHR9XG5cblx0LyoqIEdldHMgdGhlIGFjY2Vzc29yIG1hbmFnZXIgaW5zdGFuY2UuICovXG5cdHB1YmxpYyBnZXRBY2Nlc3Nvck1hbmFnZXIoKTogQXBwQWNjZXNzb3JNYW5hZ2VyIHtcblx0XHRyZXR1cm4gdGhpcy5hY2Nlc3Nvck1hbmFnZXI7XG5cdH1cblxuXHQvKiogR2V0cyB0aGUgaW5zdGFuY2Ugb2YgdGhlIEJyaWRnZSBtYW5hZ2VyLiAqL1xuXHRwdWJsaWMgZ2V0QnJpZGdlcygpOiBBcHBCcmlkZ2VzIHtcblx0XHRyZXR1cm4gdGhpcy5icmlkZ2VzO1xuXHR9XG5cblx0LyoqIEdldHMgdGhlIGluc3RhbmNlIG9mIHRoZSBsaXN0ZW5lciBtYW5hZ2VyLiAqL1xuXHRwdWJsaWMgZ2V0TGlzdGVuZXJNYW5hZ2VyKCk6IEFwcExpc3RlbmVyTWFuYWdlciB7XG5cdFx0cmV0dXJuIHRoaXMubGlzdGVuZXJNYW5hZ2VyO1xuXHR9XG5cblx0LyoqIEdldHMgdGhlIGNvbW1hbmQgbWFuYWdlcidzIGluc3RhbmNlLiAqL1xuXHRwdWJsaWMgZ2V0Q29tbWFuZE1hbmFnZXIoKTogQXBwU2xhc2hDb21tYW5kTWFuYWdlciB7XG5cdFx0cmV0dXJuIHRoaXMuY29tbWFuZE1hbmFnZXI7XG5cdH1cblxuXHRwdWJsaWMgZ2V0VmlkZW9Db25mUHJvdmlkZXJNYW5hZ2VyKCk6IEFwcFZpZGVvQ29uZlByb3ZpZGVyTWFuYWdlciB7XG5cdFx0cmV0dXJuIHRoaXMudmlkZW9Db25mUHJvdmlkZXJNYW5hZ2VyO1xuXHR9XG5cblx0cHVibGljIGdldE91dGJvdW5kQ29tbXVuaWNhdGlvblByb3ZpZGVyTWFuYWdlcigpOiBBcHBPdXRib3VuZENvbW11bmljYXRpb25Qcm92aWRlck1hbmFnZXIge1xuXHRcdHJldHVybiB0aGlzLm91dGJvdW5kQ29tbXVuaWNhdGlvblByb3ZpZGVyTWFuYWdlcjtcblx0fVxuXG5cdHB1YmxpYyBnZXRMaWNlbnNlTWFuYWdlcigpOiBBcHBMaWNlbnNlTWFuYWdlciB7XG5cdFx0cmV0dXJuIHRoaXMubGljZW5zZU1hbmFnZXI7XG5cdH1cblxuXHQvKiogR2V0cyB0aGUgYXBpIG1hbmFnZXIncyBpbnN0YW5jZS4gKi9cblx0cHVibGljIGdldEFwaU1hbmFnZXIoKTogQXBwQXBpTWFuYWdlciB7XG5cdFx0cmV0dXJuIHRoaXMuYXBpTWFuYWdlcjtcblx0fVxuXG5cdC8qKiBHZXRzIHRoZSBleHRlcm5hbCBjb21wb25lbnQgbWFuYWdlcidzIGluc3RhbmNlLiAqL1xuXHRwdWJsaWMgZ2V0RXh0ZXJuYWxDb21wb25lbnRNYW5hZ2VyKCk6IEFwcEV4dGVybmFsQ29tcG9uZW50TWFuYWdlciB7XG5cdFx0cmV0dXJuIHRoaXMuZXh0ZXJuYWxDb21wb25lbnRNYW5hZ2VyO1xuXHR9XG5cblx0LyoqIEdldHMgdGhlIG1hbmFnZXIgb2YgdGhlIHNldHRpbmdzLCB1cGRhdGVzIGFuZCBnZXR0aW5nLiAqL1xuXHRwdWJsaWMgZ2V0U2V0dGluZ3NNYW5hZ2VyKCk6IEFwcFNldHRpbmdzTWFuYWdlciB7XG5cdFx0cmV0dXJuIHRoaXMuc2V0dGluZ3NNYW5hZ2VyO1xuXHR9XG5cblx0cHVibGljIGdldFNjaGVkdWxlck1hbmFnZXIoKTogQXBwU2NoZWR1bGVyTWFuYWdlciB7XG5cdFx0cmV0dXJuIHRoaXMuc2NoZWR1bGVyTWFuYWdlcjtcblx0fVxuXG5cdHB1YmxpYyBnZXRVSUFjdGlvbkJ1dHRvbk1hbmFnZXIoKTogVUlBY3Rpb25CdXR0b25NYW5hZ2VyIHtcblx0XHRyZXR1cm4gdGhpcy51aUFjdGlvbkJ1dHRvbk1hbmFnZXI7XG5cdH1cblxuXHRwdWJsaWMgZ2V0U2lnbmF0dXJlTWFuYWdlcigpOiBBcHBTaWduYXR1cmVNYW5hZ2VyIHtcblx0XHRyZXR1cm4gdGhpcy5zaWduYXR1cmVNYW5hZ2VyO1xuXHR9XG5cblx0cHVibGljIGdldFJ1bnRpbWUoKTogQXBwUnVudGltZU1hbmFnZXIge1xuXHRcdHJldHVybiB0aGlzLnJ1bnRpbWU7XG5cdH1cblxuXHQvKiogR2V0cyB3aGV0aGVyIHRoZSBBcHBzIGhhdmUgYmVlbiBsb2FkZWQgb3Igbm90LiAqL1xuXHRwdWJsaWMgYXJlQXBwc0xvYWRlZCgpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gdGhpcy5pc0xvYWRlZDtcblx0fVxuXG5cdHB1YmxpYyBzZXRTb3VyY2VTdG9yYWdlKHN0b3JhZ2U6IEFwcFNvdXJjZVN0b3JhZ2UpOiB2b2lkIHtcblx0XHR0aGlzLmFwcFNvdXJjZVN0b3JhZ2UgPSBzdG9yYWdlO1xuXHR9XG5cblx0LyoqXG5cdCAqIEdvZXMgdGhyb3VnaCB0aGUgZW50aXJlIGxvYWRpbmcgdXAgcHJvY2Vzcy5cblx0ICogRXhwZWN0IHRoaXMgdG8gdGFrZSBzb21lIHRpbWUsIGFzIGl0IGdvZXMgdGhyb3VnaCBhIHZlcnlcblx0ICogbG9uZyBwcm9jZXNzIG9mIGxvYWRpbmcgYWxsIHRoZSBBcHBzIHVwLlxuXHQgKi9cblx0cHVibGljIGFzeW5jIGxvYWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG5cdFx0Ly8gWW91IGNhbiBub3QgbG9hZCB0aGUgQXBwTWFuYWdlciBzeXN0ZW0gYWdhaW5cblx0XHQvLyBpZiBpdCBoYXMgYWxyZWFkeSBiZWVuIGxvYWRlZC5cblx0XHRpZiAodGhpcy5pc0xvYWRlZCkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0Y29uc3QgaXRlbXM6IE1hcDxzdHJpbmcsIElBcHBTdG9yYWdlSXRlbT4gPSBhd2FpdCB0aGlzLmFwcE1ldGFkYXRhU3RvcmFnZS5yZXRyaWV2ZUFsbCgpO1xuXG5cdFx0Zm9yIChjb25zdCBpdGVtIG9mIGl0ZW1zLnZhbHVlcygpKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRjb25zdCBhcHBQYWNrYWdlID0gYXdhaXQgdGhpcy5hcHBTb3VyY2VTdG9yYWdlLmZldGNoKGl0ZW0pO1xuXHRcdFx0XHRjb25zdCB1bnBhY2thZ2VSZXN1bHQgPSBhd2FpdCB0aGlzLmdldFBhcnNlcigpLnVucGFja2FnZUFwcChhcHBQYWNrYWdlKTtcblxuXHRcdFx0XHRjb25zdCBhcHAgPSBhd2FpdCB0aGlzLmdldENvbXBpbGVyKCkudG9TYW5kQm94KHRoaXMsIGl0ZW0sIHVucGFja2FnZVJlc3VsdCk7XG5cblx0XHRcdFx0dGhpcy5hcHBzLnNldChpdGVtLmlkLCBhcHApO1xuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRjb25zb2xlLndhcm4oYEVycm9yIHdoaWxlIGNvbXBpbGluZyB0aGUgQXBwIFwiJHtpdGVtLmluZm8ubmFtZX0gKCR7aXRlbS5pZH0pXCI6YCk7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoZSk7XG5cblx0XHRcdFx0Y29uc3QgcHJsID0gbmV3IFByb3hpZWRBcHAodGhpcywgaXRlbSwgbmV3IEVtcHR5UnVudGltZShpdGVtLmlkKSk7XG5cblx0XHRcdFx0dGhpcy5hcHBzLnNldChpdGVtLmlkLCBwcmwpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHRoaXMuaXNMb2FkZWQgPSB0cnVlO1xuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cblx0cHVibGljIGFzeW5jIGVuYWJsZUFsbCgpOiBQcm9taXNlPEFycmF5PEFwcEZhYnJpY2F0aW9uRnVsZmlsbG1lbnQ+PiB7XG5cdFx0Y29uc3QgYWZmczogQXJyYXk8QXBwRmFicmljYXRpb25GdWxmaWxsbWVudD4gPSBbXTtcblxuXHRcdC8vIExldCdzIGluaXRpYWxpemUgdGhlbVxuXHRcdGZvciAoY29uc3Qgcmwgb2YgdGhpcy5hcHBzLnZhbHVlcygpKSB7XG5cdFx0XHRjb25zdCBhZmYgPSBuZXcgQXBwRmFicmljYXRpb25GdWxmaWxsbWVudCgpO1xuXG5cdFx0XHRhZmYuc2V0QXBwSW5mbyhybC5nZXRJbmZvKCkpO1xuXHRcdFx0YWZmLnNldEltcGxlbWVudGVkSW50ZXJmYWNlcyhybC5nZXRJbXBsZW1lbnRhdGlvbkxpc3QoKSk7XG5cdFx0XHRhZmYuc2V0QXBwKHJsKTtcblx0XHRcdGFmZnMucHVzaChhZmYpO1xuXG5cdFx0XHRpZiAoQXBwU3RhdHVzVXRpbHMuaXNEaXNhYmxlZChhd2FpdCBybC5nZXRTdGF0dXMoKSkpIHtcblx0XHRcdFx0Ly8gVXN1YWxseSBpZiBhbiBBcHAgaXMgZGlzYWJsZWQgYmVmb3JlIGl0J3MgaW5pdGlhbGl6ZWQsXG5cdFx0XHRcdC8vIHRoZW4gc29tZXRoaW5nIChzdWNoIGFzIGFuIGVycm9yKSBvY2N1cmVkIHdoaWxlXG5cdFx0XHRcdC8vIGl0IHdhcyBjb21waWxlZCBvciBzb21ldGhpbmcgc2ltaWxhci5cblx0XHRcdFx0Ly8gV2Ugc3RpbGwgaGF2ZSB0byB2YWxpZGF0ZSBpdHMgbGljZW5zZSwgdGhvdWdoXG5cdFx0XHRcdGF3YWl0IHJsLnZhbGlkYXRlTGljZW5zZSgpO1xuXG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRhd2FpdCB0aGlzLmluaXRpYWxpemVBcHAocmwsIHRydWUpLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xuXHRcdH1cblxuXHRcdC8vIExldCdzIGVuc3VyZSB0aGUgcmVxdWlyZWQgc2V0dGluZ3MgYXJlIGFsbCBzZXRcblx0XHRmb3IgKGNvbnN0IHJsIG9mIHRoaXMuYXBwcy52YWx1ZXMoKSkge1xuXHRcdFx0aWYgKEFwcFN0YXR1c1V0aWxzLmlzRGlzYWJsZWQoYXdhaXQgcmwuZ2V0U3RhdHVzKCkpKSB7XG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIXRoaXMuYXJlUmVxdWlyZWRTZXR0aW5nc1NldChybC5nZXRTdG9yYWdlSXRlbSgpKSkge1xuXHRcdFx0XHRhd2FpdCBybC5zZXRTdGF0dXMoQXBwU3RhdHVzLklOVkFMSURfU0VUVElOR1NfRElTQUJMRUQpLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIE5vdyBsZXQncyBlbmFibGUgdGhlIGFwcHMgd2hpY2ggd2VyZSBvbmNlIGVuYWJsZWRcblx0XHQvLyBidXQgYXJlIG5vdCBjdXJyZW50bHkgZGlzYWJsZWQuXG5cdFx0Zm9yIChjb25zdCBhcHAgb2YgdGhpcy5hcHBzLnZhbHVlcygpKSB7XG5cdFx0XHRjb25zdCBzdGF0dXMgPSBhd2FpdCBhcHAuZ2V0U3RhdHVzKCk7XG5cdFx0XHRpZiAoIUFwcFN0YXR1c1V0aWxzLmlzRGlzYWJsZWQoc3RhdHVzKSAmJiBBcHBTdGF0dXNVdGlscy5pc0VuYWJsZWQoYXBwLmdldFByZXZpb3VzU3RhdHVzKCkpKSB7XG5cdFx0XHRcdGF3YWl0IHRoaXMuZW5hYmxlQXBwKGFwcCkuY2F0Y2goY29uc29sZS5lcnJvcik7XG5cdFx0XHR9IGVsc2UgaWYgKCFBcHBTdGF0dXNVdGlscy5pc0Vycm9yKHN0YXR1cykpIHtcblx0XHRcdFx0dGhpcy5saXN0ZW5lck1hbmFnZXIubG9ja0Vzc2VudGlhbEV2ZW50cyhhcHApO1xuXHRcdFx0XHR0aGlzLnVpQWN0aW9uQnV0dG9uTWFuYWdlci5jbGVhckFwcEFjdGlvbkJ1dHRvbnMoYXBwLmdldElEKCkpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBhZmZzO1xuXHR9XG5cblx0cHVibGljIGFzeW5jIHVubG9hZChpc01hbnVhbDogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xuXHRcdC8vIElmIHRoZSBBcHBNYW5hZ2VyIGhhc24ndCBiZWVuIGxvYWRlZCB5ZXQsIHRoZW5cblx0XHQvLyB0aGVyZSBpcyBub3RoaW5nIHRvIHVubG9hZFxuXHRcdGlmICghdGhpcy5pc0xvYWRlZCkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGZvciAoY29uc3QgYXBwIG9mIHRoaXMuYXBwcy52YWx1ZXMoKSkge1xuXHRcdFx0Y29uc3Qgc3RhdHVzID0gYXdhaXQgYXBwLmdldFN0YXR1cygpO1xuXHRcdFx0aWYgKHN0YXR1cyA9PT0gQXBwU3RhdHVzLklOSVRJQUxJWkVEKSB7XG5cdFx0XHRcdGF3YWl0IHRoaXMucHVyZ2VBcHBDb25maWcoYXBwKTtcblx0XHRcdH0gZWxzZSBpZiAoIUFwcFN0YXR1c1V0aWxzLmlzRGlzYWJsZWQoc3RhdHVzKSkge1xuXHRcdFx0XHRhd2FpdCB0aGlzLmRpc2FibGUoYXBwLmdldElEKCksIGlzTWFudWFsID8gQXBwU3RhdHVzLk1BTlVBTExZX0RJU0FCTEVEIDogQXBwU3RhdHVzLkRJU0FCTEVEKTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5saXN0ZW5lck1hbmFnZXIucmVsZWFzZUVzc2VudGlhbEV2ZW50cyhhcHApO1xuXG5cdFx0XHRhcHAuZ2V0UnVudGltZUNvbnRyb2xsZXIoKS5zdG9wQXBwKCk7XG5cdFx0fVxuXG5cdFx0Ly8gUmVtb3ZlIGFsbCB0aGUgYXBwcyBmcm9tIHRoZSBzeXN0ZW0gbm93IHRoYXQgd2UgaGF2ZSB1bmxvYWRlZCBldmVyeXRoaW5nXG5cdFx0dGhpcy5hcHBzLmNsZWFyKCk7XG5cblx0XHR0aGlzLmlzTG9hZGVkID0gZmFsc2U7XG5cdH1cblxuXHQvKiogR2V0cyB0aGUgQXBwcyB3aGljaCBtYXRjaCB0aGUgZmlsdGVyIHBhc3NlZCBpbi4gKi9cblx0cHVibGljIGFzeW5jIGdldChmaWx0ZXI/OiBJR2V0QXBwc0ZpbHRlcik6IFByb21pc2U8UHJveGllZEFwcFtdPiB7XG5cdFx0bGV0IHJsczogQXJyYXk8UHJveGllZEFwcD4gPSBbXTtcblxuXHRcdGlmICh0eXBlb2YgZmlsdGVyID09PSAndW5kZWZpbmVkJykge1xuXHRcdFx0dGhpcy5hcHBzLmZvckVhY2goKHJsKSA9PiBybHMucHVzaChybCkpO1xuXG5cdFx0XHRyZXR1cm4gcmxzO1xuXHRcdH1cblxuXHRcdGxldCBub3RoaW5nID0gdHJ1ZTtcblxuXHRcdGlmICh0eXBlb2YgZmlsdGVyLmVuYWJsZWQgPT09ICdib29sZWFuJyAmJiBmaWx0ZXIuZW5hYmxlZCkge1xuXHRcdFx0Zm9yIChjb25zdCBybCBvZiB0aGlzLmFwcHMudmFsdWVzKCkpIHtcblx0XHRcdFx0aWYgKEFwcFN0YXR1c1V0aWxzLmlzRW5hYmxlZChhd2FpdCBybC5nZXRTdGF0dXMoKSkpIHtcblx0XHRcdFx0XHRybHMucHVzaChybCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0bm90aGluZyA9IGZhbHNlO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgZmlsdGVyLmRpc2FibGVkID09PSAnYm9vbGVhbicgJiYgZmlsdGVyLmRpc2FibGVkKSB7XG5cdFx0XHRmb3IgKGNvbnN0IHJsIG9mIHRoaXMuYXBwcy52YWx1ZXMoKSkge1xuXHRcdFx0XHRpZiAoQXBwU3RhdHVzVXRpbHMuaXNEaXNhYmxlZChhd2FpdCBybC5nZXRTdGF0dXMoKSkpIHtcblx0XHRcdFx0XHRybHMucHVzaChybCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0bm90aGluZyA9IGZhbHNlO1xuXHRcdH1cblxuXHRcdGlmIChub3RoaW5nKSB7XG5cdFx0XHR0aGlzLmFwcHMuZm9yRWFjaCgocmwpID0+IHJscy5wdXNoKHJsKSk7XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiBmaWx0ZXIuaWRzICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0cmxzID0gcmxzLmZpbHRlcigocmwpID0+IGZpbHRlci5pZHMuaW5jbHVkZXMocmwuZ2V0SUQoKSkpO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgZmlsdGVyLmluc3RhbGxhdGlvblNvdXJjZSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdHJscyA9IHJscy5maWx0ZXIoKHJsKSA9PiBybC5nZXRJbnN0YWxsYXRpb25Tb3VyY2UoKSA9PT0gZmlsdGVyLmluc3RhbGxhdGlvblNvdXJjZSk7XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiBmaWx0ZXIubmFtZSA9PT0gJ3N0cmluZycpIHtcblx0XHRcdHJscyA9IHJscy5maWx0ZXIoKHJsKSA9PiBybC5nZXROYW1lKCkgPT09IGZpbHRlci5uYW1lKTtcblx0XHR9IGVsc2UgaWYgKGZpbHRlci5uYW1lIGluc3RhbmNlb2YgUmVnRXhwKSB7XG5cdFx0XHRybHMgPSBybHMuZmlsdGVyKChybCkgPT4gKGZpbHRlci5uYW1lIGFzIFJlZ0V4cCkudGVzdChybC5nZXROYW1lKCkpKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gcmxzO1xuXHR9XG5cblx0LyoqIEdldHMgYSBzaW5nbGUgQXBwIGJ5IHRoZSBpZCBwYXNzZWQgaW4uICovXG5cdHB1YmxpYyBnZXRPbmVCeUlkKGFwcElkOiBzdHJpbmcpOiBQcm94aWVkQXBwIHtcblx0XHRyZXR1cm4gdGhpcy5hcHBzLmdldChhcHBJZCk7XG5cdH1cblxuXHRwdWJsaWMgZ2V0UGVybWlzc2lvbnNCeUlkKGFwcElkOiBzdHJpbmcpOiBBcnJheTxJUGVybWlzc2lvbj4ge1xuXHRcdGNvbnN0IGFwcCA9IHRoaXMuYXBwcy5nZXQoYXBwSWQpO1xuXG5cdFx0aWYgKCFhcHApIHtcblx0XHRcdHJldHVybiBbXTtcblx0XHR9XG5cdFx0Y29uc3QgeyBwZXJtaXNzaW9uc0dyYW50ZWQgfSA9IGFwcC5nZXRTdG9yYWdlSXRlbSgpO1xuXG5cdFx0cmV0dXJuIHBlcm1pc3Npb25zR3JhbnRlZCB8fCBkZWZhdWx0UGVybWlzc2lvbnM7XG5cdH1cblxuXHRwdWJsaWMgYXN5bmMgZW5hYmxlKGlkOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0XHRjb25zdCBybCA9IHRoaXMuYXBwcy5nZXQoaWQpO1xuXG5cdFx0aWYgKCFybCkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBObyBBcHAgYnkgdGhlIGlkIFwiJHtpZH1cIiBleGlzdHMuYCk7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgc3RhdHVzID0gYXdhaXQgcmwuZ2V0U3RhdHVzKCk7XG5cblx0XHRpZiAoQXBwU3RhdHVzVXRpbHMuaXNFbmFibGVkKHN0YXR1cykpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdGlmIChzdGF0dXMgPT09IEFwcFN0YXR1cy5DT01QSUxFUl9FUlJPUl9ESVNBQkxFRCkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdUaGUgQXBwIGhhZCBjb21waWxlciBlcnJvcnMsIGNhbiBub3QgZW5hYmxlIGl0LicpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHN0b3JhZ2VJdGVtID0gYXdhaXQgdGhpcy5hcHBNZXRhZGF0YVN0b3JhZ2UucmV0cmlldmVPbmUoaWQpO1xuXG5cdFx0aWYgKCFzdG9yYWdlSXRlbSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBDb3VsZCBub3QgZW5hYmxlIGFuIEFwcCB3aXRoIHRoZSBpZCBvZiBcIiR7aWR9XCIgYXMgaXQgZG9lc24ndCBleGlzdC5gKTtcblx0XHR9XG5cblx0XHRjb25zdCBpc1NldHVwID0gYXdhaXQgdGhpcy5ydW5TdGFydFVwUHJvY2VzcyhzdG9yYWdlSXRlbSwgcmwsIGZhbHNlKTtcblxuXHRcdHJldHVybiBpc1NldHVwO1xuXHR9XG5cblx0cHVibGljIGFzeW5jIGRpc2FibGUoaWQ6IHN0cmluZywgc3RhdHVzOiBBcHBTdGF0dXMgPSBBcHBTdGF0dXMuRElTQUJMRUQsIHNpbGVudD86IGJvb2xlYW4pOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0XHRpZiAoIUFwcFN0YXR1c1V0aWxzLmlzRGlzYWJsZWQoc3RhdHVzKSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGRpc2FibGVkIHN0YXR1cycpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGFwcCA9IHRoaXMuYXBwcy5nZXQoaWQpO1xuXG5cdFx0aWYgKCFhcHApIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihgTm8gQXBwIGJ5IHRoZSBpZCBcIiR7aWR9XCIgZXhpc3RzLmApO1xuXHRcdH1cblxuXHRcdGlmIChBcHBTdGF0dXNVdGlscy5pc0VuYWJsZWQoYXdhaXQgYXBwLmdldFN0YXR1cygpKSkge1xuXHRcdFx0YXdhaXQgYXBwLmNhbGwoQXBwTWV0aG9kLk9ORElTQUJMRSkuY2F0Y2goKGUpID0+IGNvbnNvbGUud2FybignRXJyb3Igd2hpbGUgZGlzYWJsaW5nOicsIGUpKTtcblx0XHR9XG5cblx0XHRhd2FpdCB0aGlzLnB1cmdlQXBwQ29uZmlnKGFwcCwge1xuXHRcdFx0a2VlcFNjaGVkdWxlZEpvYnM6IHRydWUsXG5cdFx0XHRrZWVwU2xhc2hjb21tYW5kczogdHJ1ZSxcblx0XHRcdGtlZXBPdXRib3VuZENvbW11bmljYXRpb25Qcm92aWRlcnM6IHRydWUsXG5cdFx0fSk7XG5cblx0XHRhd2FpdCBhcHAuc2V0U3RhdHVzKHN0YXR1cywgc2lsZW50KTtcblxuXHRcdGNvbnN0IHN0b3JhZ2VJdGVtID0gYXdhaXQgdGhpcy5hcHBNZXRhZGF0YVN0b3JhZ2UucmV0cmlldmVPbmUoaWQpO1xuXG5cdFx0YXBwLmdldFN0b3JhZ2VJdGVtKCkubWFya2V0cGxhY2VJbmZvID0gc3RvcmFnZUl0ZW0ubWFya2V0cGxhY2VJbmZvO1xuXHRcdGF3YWl0IGFwcC52YWxpZGF0ZUxpY2Vuc2UoKS5jYXRjaCgoKSA9PiB7fSk7XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxuXG5cdHB1YmxpYyBhc3luYyBtaWdyYXRlKGlkOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0XHRjb25zdCBhcHAgPSB0aGlzLmFwcHMuZ2V0KGlkKTtcblxuXHRcdGlmICghYXBwKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYE5vIEFwcCBieSB0aGUgaWQgXCIke2lkfVwiIGV4aXN0cy5gKTtcblx0XHR9XG5cblx0XHRhd2FpdCBhcHAuY2FsbChBcHBNZXRob2QuT05VUERBVEUpLmNhdGNoKChlKSA9PiBjb25zb2xlLndhcm4oJ0Vycm9yIHdoaWxlIG1pZ3JhdGluZzonLCBlKSk7XG5cblx0XHRhd2FpdCB0aGlzLnB1cmdlQXBwQ29uZmlnKGFwcCwgeyBrZWVwU2NoZWR1bGVkSm9iczogdHJ1ZSB9KTtcblxuXHRcdGNvbnN0IHN0b3JhZ2VJdGVtID0gYXdhaXQgdGhpcy5hcHBNZXRhZGF0YVN0b3JhZ2UucmV0cmlldmVPbmUoaWQpO1xuXG5cdFx0YXBwLmdldFN0b3JhZ2VJdGVtKCkubWFya2V0cGxhY2VJbmZvID0gc3RvcmFnZUl0ZW0ubWFya2V0cGxhY2VJbmZvO1xuXHRcdGF3YWl0IGFwcC52YWxpZGF0ZUxpY2Vuc2UoKS5jYXRjaCgoKSA9PiB7fSk7XG5cblx0XHRzdG9yYWdlSXRlbS5taWdyYXRlZCA9IHRydWU7XG5cdFx0c3RvcmFnZUl0ZW0uc2lnbmF0dXJlID0gYXdhaXQgdGhpcy5nZXRTaWduYXR1cmVNYW5hZ2VyKCkuc2lnbkFwcChzdG9yYWdlSXRlbSk7XG5cblx0XHRjb25zdCB7IG1hcmtldHBsYWNlSW5mbywgc2lnbmF0dXJlLCBtaWdyYXRlZCwgX2lkIH0gPSBzdG9yYWdlSXRlbTtcblx0XHRjb25zdCBzdG9yZWQgPSBhd2FpdCB0aGlzLmFwcE1ldGFkYXRhU3RvcmFnZS51cGRhdGVQYXJ0aWFsQW5kUmV0dXJuRG9jdW1lbnQoeyBtYXJrZXRwbGFjZUluZm8sIHNpZ25hdHVyZSwgbWlncmF0ZWQsIF9pZCB9KTtcblxuXHRcdGF3YWl0IHRoaXMudXBkYXRlTG9jYWwoc3RvcmVkLCBhcHApO1xuXHRcdGF3YWl0IHRoaXMuYnJpZGdlc1xuXHRcdFx0LmdldEFwcEFjdGl2YXRpb25CcmlkZ2UoKVxuXHRcdFx0LmRvQXBwVXBkYXRlZChhcHApXG5cdFx0XHQuY2F0Y2goKCkgPT4ge30pO1xuXG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHRwdWJsaWMgYXN5bmMgYWRkTG9jYWwoYXBwSWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IHN0b3JhZ2VJdGVtID0gYXdhaXQgdGhpcy5hcHBNZXRhZGF0YVN0b3JhZ2UucmV0cmlldmVPbmUoYXBwSWQpO1xuXG5cdFx0aWYgKCFzdG9yYWdlSXRlbSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBBcHAgd2l0aCBpZCAke2FwcElkfSBjb3VsZG4ndCBiZSBmb3VuZGApO1xuXHRcdH1cblxuXHRcdGNvbnN0IGFwcFBhY2thZ2UgPSBhd2FpdCB0aGlzLmFwcFNvdXJjZVN0b3JhZ2UuZmV0Y2goc3RvcmFnZUl0ZW0pO1xuXG5cdFx0aWYgKCFhcHBQYWNrYWdlKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYFBhY2thZ2UgZmlsZSBmb3IgYXBwIFwiJHtzdG9yYWdlSXRlbS5pbmZvLm5hbWV9XCIgKCR7YXBwSWR9KSBjb3VsZG4ndCBiZSBmb3VuZGApO1xuXHRcdH1cblxuXHRcdGNvbnN0IHBhcnNlZFBhY2thZ2UgPSBhd2FpdCB0aGlzLmdldFBhcnNlcigpLnVucGFja2FnZUFwcChhcHBQYWNrYWdlKTtcblx0XHRjb25zdCBhcHAgPSBhd2FpdCB0aGlzLmdldENvbXBpbGVyKCkudG9TYW5kQm94KHRoaXMsIHN0b3JhZ2VJdGVtLCBwYXJzZWRQYWNrYWdlKTtcblxuXHRcdHRoaXMuYXBwcy5zZXQoYXBwLmdldElEKCksIGFwcCk7XG5cblx0XHRhd2FpdCB0aGlzLmxvYWRPbmUoYXBwSWQpO1xuXHR9XG5cblx0cHVibGljIGFzeW5jIGFkZChhcHBQYWNrYWdlOiBCdWZmZXIsIGluc3RhbGxhdGlvblBhcmFtZXRlcnM6IElBcHBJbnN0YWxsUGFyYW1ldGVycyk6IFByb21pc2U8QXBwRmFicmljYXRpb25GdWxmaWxsbWVudD4ge1xuXHRcdGNvbnN0IHsgZW5hYmxlID0gdHJ1ZSwgbWFya2V0cGxhY2VJbmZvLCBwZXJtaXNzaW9uc0dyYW50ZWQsIHVzZXIgfSA9IGluc3RhbGxhdGlvblBhcmFtZXRlcnM7XG5cblx0XHRjb25zdCBhZmYgPSBuZXcgQXBwRmFicmljYXRpb25GdWxmaWxsbWVudCgpO1xuXHRcdGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuZ2V0UGFyc2VyKCkudW5wYWNrYWdlQXBwKGFwcFBhY2thZ2UpO1xuXHRcdGNvbnN0IHVuZG9TdGVwczogQXJyYXk8KCkgPT4gdm9pZD4gPSBbXTtcblxuXHRcdGFmZi5zZXRBcHBJbmZvKHJlc3VsdC5pbmZvKTtcblx0XHRhZmYuc2V0SW1wbGVtZW50ZWRJbnRlcmZhY2VzKHJlc3VsdC5pbXBsZW1lbnRlZC5nZXRWYWx1ZXMoKSk7XG5cblx0XHRjb25zdCBkZXNjcmlwdG9yOiBJQXBwU3RvcmFnZUl0ZW0gPSB7XG5cdFx0XHRpZDogcmVzdWx0LmluZm8uaWQsXG5cdFx0XHRpbmZvOiByZXN1bHQuaW5mbyxcblx0XHRcdHN0YXR1czogZW5hYmxlID8gQXBwU3RhdHVzLk1BTlVBTExZX0VOQUJMRUQgOiBBcHBTdGF0dXMuTUFOVUFMTFlfRElTQUJMRUQsXG5cdFx0XHRzZXR0aW5nczoge30sXG5cdFx0XHRpbXBsZW1lbnRlZDogcmVzdWx0LmltcGxlbWVudGVkLmdldFZhbHVlcygpLFxuXHRcdFx0aW5zdGFsbGF0aW9uU291cmNlOiBtYXJrZXRwbGFjZUluZm8gPyBBcHBJbnN0YWxsYXRpb25Tb3VyY2UuTUFSS0VUUExBQ0UgOiBBcHBJbnN0YWxsYXRpb25Tb3VyY2UuUFJJVkFURSxcblx0XHRcdG1hcmtldHBsYWNlSW5mbyxcblx0XHRcdHBlcm1pc3Npb25zR3JhbnRlZCxcblx0XHRcdGxhbmd1YWdlQ29udGVudDogcmVzdWx0Lmxhbmd1YWdlQ29udGVudCxcblx0XHR9O1xuXG5cdFx0dHJ5IHtcblx0XHRcdGRlc2NyaXB0b3Iuc291cmNlUGF0aCA9IGF3YWl0IHRoaXMuYXBwU291cmNlU3RvcmFnZS5zdG9yZShkZXNjcmlwdG9yLCBhcHBQYWNrYWdlKTtcblxuXHRcdFx0dW5kb1N0ZXBzLnB1c2goKCkgPT4gdGhpcy5hcHBTb3VyY2VTdG9yYWdlLnJlbW92ZShkZXNjcmlwdG9yKSk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdGFmZi5zZXRTdG9yYWdlRXJyb3IoJ0ZhaWxlZCB0byBzdG9yZSBhcHAgcGFja2FnZScpO1xuXG5cdFx0XHRyZXR1cm4gYWZmO1xuXHRcdH1cblxuXHRcdGxldCBhcHA6IFByb3hpZWRBcHA7XG5cblx0XHR0cnkge1xuXHRcdFx0YXBwID0gYXdhaXQgdGhpcy5nZXRDb21waWxlcigpLnRvU2FuZEJveCh0aGlzLCBkZXNjcmlwdG9yLCByZXN1bHQpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRhd2FpdCBQcm9taXNlLmFsbCh1bmRvU3RlcHMubWFwKCh1bmRvZXIpID0+IHVuZG9lcigpKSk7XG5cblx0XHRcdHRocm93IGVycm9yO1xuXHRcdH1cblxuXHRcdHVuZG9TdGVwcy5wdXNoKCgpID0+XG5cdFx0XHR0aGlzLmdldFJ1bnRpbWUoKVxuXHRcdFx0XHQuc3RvcFJ1bnRpbWUoYXBwLmdldFJ1bnRpbWVDb250cm9sbGVyKCkpXG5cdFx0XHRcdC5jYXRjaCgoKSA9PiB7fSksXG5cdFx0KTtcblxuXHRcdC8vIENyZWF0ZSBhIHVzZXIgZm9yIHRoZSBhcHBcblx0XHR0cnkge1xuXHRcdFx0YXdhaXQgdGhpcy5jcmVhdGVBcHBVc2VyKHJlc3VsdC5pbmZvKTtcblxuXHRcdFx0dW5kb1N0ZXBzLnB1c2goKCkgPT4gdGhpcy5yZW1vdmVBcHBVc2VyKGFwcCkpO1xuXHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0YWZmLnNldEFwcFVzZXJFcnJvcih7XG5cdFx0XHRcdHVzZXJuYW1lOiBgJHtyZXN1bHQuaW5mby5uYW1lU2x1Z30uYm90YCxcblx0XHRcdFx0bWVzc2FnZTogJ0ZhaWxlZCB0byBjcmVhdGUgYW4gYXBwIHVzZXIgZm9yIHRoaXMgYXBwLicsXG5cdFx0XHR9KTtcblxuXHRcdFx0YXdhaXQgUHJvbWlzZS5hbGwodW5kb1N0ZXBzLm1hcCgodW5kb2VyKSA9PiB1bmRvZXIoKSkpO1xuXG5cdFx0XHRyZXR1cm4gYWZmO1xuXHRcdH1cblxuXHRcdGRlc2NyaXB0b3Iuc2lnbmF0dXJlID0gYXdhaXQgdGhpcy5nZXRTaWduYXR1cmVNYW5hZ2VyKCkuc2lnbkFwcChkZXNjcmlwdG9yKTtcblx0XHRjb25zdCBjcmVhdGVkID0gYXdhaXQgdGhpcy5hcHBNZXRhZGF0YVN0b3JhZ2UuY3JlYXRlKGRlc2NyaXB0b3IpO1xuXG5cdFx0aWYgKCFjcmVhdGVkKSB7XG5cdFx0XHRhZmYuc2V0U3RvcmFnZUVycm9yKCdGYWlsZWQgdG8gY3JlYXRlIHRoZSBBcHAsIHRoZSBzdG9yYWdlIGRpZCBub3QgcmV0dXJuIGl0LicpO1xuXG5cdFx0XHRhd2FpdCBQcm9taXNlLmFsbCh1bmRvU3RlcHMubWFwKCh1bmRvZXIpID0+IHVuZG9lcigpKSk7XG5cblx0XHRcdHJldHVybiBhZmY7XG5cdFx0fVxuXG5cdFx0YXBwLmdldFN0b3JhZ2VJdGVtKCkuX2lkID0gY3JlYXRlZC5faWQ7XG5cblx0XHR0aGlzLmFwcHMuc2V0KGFwcC5nZXRJRCgpLCBhcHApO1xuXHRcdGFmZi5zZXRBcHAoYXBwKTtcblxuXHRcdC8vIExldCBldmVyeW9uZSBrbm93IHRoYXQgdGhlIEFwcCBoYXMgYmVlbiBhZGRlZFxuXHRcdGF3YWl0IHRoaXMuYnJpZGdlc1xuXHRcdFx0LmdldEFwcEFjdGl2YXRpb25CcmlkZ2UoKVxuXHRcdFx0LmRvQXBwQWRkZWQoYXBwKVxuXHRcdFx0LmNhdGNoKCgpID0+IHtcblx0XHRcdFx0Ly8gSWYgYW4gZXJyb3Igb2NjdXJzIGR1cmluZyB0aGlzLCBvaCB3ZWxsLlxuXHRcdFx0fSk7XG5cblx0XHRhd2FpdCB0aGlzLmluc3RhbGxBcHAoYXBwLCB1c2VyKTtcblxuXHRcdC8vIFNob3VsZCBlbmFibGUgPT09IHRydWUsIHRoZW4gd2UgZ28gdGhyb3VnaCB0aGUgZW50aXJlIHN0YXJ0IHVwIHByb2Nlc3Ncblx0XHQvLyBPdGhlcndpc2UsIHdlIG9ubHkgaW5pdGlhbGl6ZSBpdC5cblx0XHRpZiAoZW5hYmxlKSB7XG5cdFx0XHQvLyBTdGFydCB1cCB0aGUgYXBwXG5cdFx0XHRhd2FpdCB0aGlzLnJ1blN0YXJ0VXBQcm9jZXNzKGNyZWF0ZWQsIGFwcCwgZmFsc2UpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRhd2FpdCB0aGlzLmluaXRpYWxpemVBcHAoYXBwKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gYWZmO1xuXHR9XG5cblx0LyoqXG5cdCAqIFVuaW5zdGFsbHMgc3BlY2lmaWVkIGFwcCBmcm9tIHRoZSBzZXJ2ZXIgYW5kIHJlbW92ZVxuXHQgKiBhbGwgZGF0YWJhc2UgcmVjb3JkcyByZWdhcmRpbmcgaXRcblx0ICpcblx0ICogQHJldHVybnMgdGhlIGluc3RhbmNlIG9mIHRoZSByZW1vdmVkIFByb3hpZWRBcHBcblx0ICovXG5cdHB1YmxpYyBhc3luYyByZW1vdmUoaWQ6IHN0cmluZywgdW5pbnN0YWxsYXRpb25QYXJhbWV0ZXJzOiBJQXBwVW5pbnN0YWxsUGFyYW1ldGVycyk6IFByb21pc2U8UHJveGllZEFwcD4ge1xuXHRcdGNvbnN0IGFwcCA9IHRoaXMuYXBwcy5nZXQoaWQpO1xuXHRcdGNvbnN0IHsgdXNlciB9ID0gdW5pbnN0YWxsYXRpb25QYXJhbWV0ZXJzO1xuXG5cdFx0Ly8gRmlyc3QgcmVtb3ZlIHRoZSBhcHBcblx0XHRhd2FpdCB0aGlzLnVuaW5zdGFsbEFwcChhcHAsIHVzZXIpO1xuXHRcdGF3YWl0IHRoaXMucmVtb3ZlTG9jYWwoaWQpO1xuXG5cdFx0Ly8gVGhlbiBsZXQgZXZlcnlvbmUga25vdyB0aGF0IHRoZSBBcHAgaGFzIGJlZW4gcmVtb3ZlZFxuXHRcdGF3YWl0IHRoaXMuYnJpZGdlcy5nZXRBcHBBY3RpdmF0aW9uQnJpZGdlKCkuZG9BcHBSZW1vdmVkKGFwcCkuY2F0Y2goKTtcblxuXHRcdHJldHVybiBhcHA7XG5cdH1cblxuXHQvKipcblx0ICogUmVtb3ZlcyB0aGUgYXBwIGluc3RhbmNlIGZyb20gdGhlIGxvY2FsIEFwcHMgY29udGFpbmVyXG5cdCAqIGFuZCBldmVyeSB0eXBlIG9mIGRhdGEgYXNzb2NpYXRlZCB3aXRoIGl0XG5cdCAqL1xuXHRwdWJsaWMgYXN5bmMgcmVtb3ZlTG9jYWwoaWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IGFwcCA9IHRoaXMuYXBwcy5nZXQoaWQpO1xuXG5cdFx0aWYgKEFwcFN0YXR1c1V0aWxzLmlzRW5hYmxlZChhd2FpdCBhcHAuZ2V0U3RhdHVzKCkpKSB7XG5cdFx0XHRhd2FpdCB0aGlzLmRpc2FibGUoaWQpO1xuXHRcdH1cblxuXHRcdGF3YWl0IHRoaXMucHVyZ2VBcHBDb25maWcoYXBwKTtcblx0XHR0aGlzLmxpc3RlbmVyTWFuYWdlci5yZWxlYXNlRXNzZW50aWFsRXZlbnRzKGFwcCk7XG5cdFx0YXdhaXQgdGhpcy5yZW1vdmVBcHBVc2VyKGFwcCk7XG5cdFx0YXdhaXQgKHRoaXMuYnJpZGdlcy5nZXRQZXJzaXN0ZW5jZUJyaWRnZSgpIGFzIElJbnRlcm5hbFBlcnNpc3RlbmNlQnJpZGdlICYgUGVyc2lzdGVuY2VCcmlkZ2UpLnB1cmdlKGFwcC5nZXRJRCgpKTtcblx0XHRhd2FpdCB0aGlzLmFwcE1ldGFkYXRhU3RvcmFnZS5yZW1vdmUoYXBwLmdldElEKCkpO1xuXHRcdGF3YWl0IHRoaXMuYXBwU291cmNlU3RvcmFnZS5yZW1vdmUoYXBwLmdldFN0b3JhZ2VJdGVtKCkpLmNhdGNoKCgpID0+IHt9KTtcblxuXHRcdC8vIEVycm9ycyBoZXJlIGRvbid0IHJlYWxseSBwcmV2ZW50IHRoZSBwcm9jZXNzIGZyb20gZHlpbmcsIHNvIHdlIGRvbid0IHJlYWxseSBuZWVkIHRvIGRvIGFueXRoaW5nIG9uIHRoZSBjYXRjaFxuXHRcdGF3YWl0IHRoaXMuZ2V0UnVudGltZSgpXG5cdFx0XHQuc3RvcFJ1bnRpbWUoYXBwLmdldFJ1bnRpbWVDb250cm9sbGVyKCkpXG5cdFx0XHQuY2F0Y2goKCkgPT4ge30pO1xuXG5cdFx0dGhpcy5hcHBzLmRlbGV0ZShhcHAuZ2V0SUQoKSk7XG5cdH1cblxuXHRwdWJsaWMgYXN5bmMgdXBkYXRlKFxuXHRcdGFwcFBhY2thZ2U6IEJ1ZmZlcixcblx0XHRwZXJtaXNzaW9uc0dyYW50ZWQ6IEFycmF5PElQZXJtaXNzaW9uPixcblx0XHR1cGRhdGVPcHRpb25zOiB7IGxvYWRBcHA/OiBib29sZWFuOyB1c2VyPzogSVVzZXIgfSA9IHsgbG9hZEFwcDogdHJ1ZSB9LFxuXHQpOiBQcm9taXNlPEFwcEZhYnJpY2F0aW9uRnVsZmlsbG1lbnQ+IHtcblx0XHRjb25zdCBhZmYgPSBuZXcgQXBwRmFicmljYXRpb25GdWxmaWxsbWVudCgpO1xuXHRcdGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuZ2V0UGFyc2VyKCkudW5wYWNrYWdlQXBwKGFwcFBhY2thZ2UpO1xuXG5cdFx0YWZmLnNldEFwcEluZm8ocmVzdWx0LmluZm8pO1xuXHRcdGFmZi5zZXRJbXBsZW1lbnRlZEludGVyZmFjZXMocmVzdWx0LmltcGxlbWVudGVkLmdldFZhbHVlcygpKTtcblxuXHRcdGNvbnN0IG9sZCA9IGF3YWl0IHRoaXMuYXBwTWV0YWRhdGFTdG9yYWdlLnJldHJpZXZlT25lKHJlc3VsdC5pbmZvLmlkKTtcblxuXHRcdGlmICghb2xkKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0NhbiBub3QgdXBkYXRlIGFuIEFwcCB0aGF0IGRvZXMgbm90IGN1cnJlbnRseSBleGlzdC4nKTtcblx0XHR9XG5cblx0XHQvLyBJZiB0aGVyZSBpcyBhbnkgZXJyb3IgZHVyaW5nIGRpc2FibGluZywgaXQgZG9lc24ndCByZWFsbHkgbWF0dGVyXG5cdFx0YXdhaXQgdGhpcy5kaXNhYmxlKG9sZC5pZCkuY2F0Y2goKCkgPT4ge30pO1xuXG5cdFx0Y29uc3QgZGVzY3JpcHRvcjogSUFwcFN0b3JhZ2VJdGVtID0ge1xuXHRcdFx0Li4ub2xkLFxuXHRcdFx0aWQ6IHJlc3VsdC5pbmZvLmlkLFxuXHRcdFx0aW5mbzogcmVzdWx0LmluZm8sXG5cdFx0XHRsYW5ndWFnZUNvbnRlbnQ6IHJlc3VsdC5sYW5ndWFnZUNvbnRlbnQsXG5cdFx0XHRpbXBsZW1lbnRlZDogcmVzdWx0LmltcGxlbWVudGVkLmdldFZhbHVlcygpLFxuXHRcdH07XG5cblx0XHRpZiAoIXBlcm1pc3Npb25zR3JhbnRlZCkge1xuXHRcdFx0ZGVsZXRlIGRlc2NyaXB0b3IucGVybWlzc2lvbnNHcmFudGVkO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRkZXNjcmlwdG9yLnBlcm1pc3Npb25zR3JhbnRlZCA9IHBlcm1pc3Npb25zR3JhbnRlZDtcblx0XHR9XG5cblx0XHR0cnkge1xuXHRcdFx0ZGVzY3JpcHRvci5zb3VyY2VQYXRoID0gYXdhaXQgdGhpcy5hcHBTb3VyY2VTdG9yYWdlLnVwZGF0ZShkZXNjcmlwdG9yLCBhcHBQYWNrYWdlKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0YWZmLnNldFN0b3JhZ2VFcnJvcignRmFpbGVkIHRvIHN0b3JhZ2UgYXBwIHBhY2thZ2UnKTtcblxuXHRcdFx0cmV0dXJuIGFmZjtcblx0XHR9XG5cblx0XHRkZXNjcmlwdG9yLnNpZ25hdHVyZSA9IGF3YWl0IHRoaXMuc2lnbmF0dXJlTWFuYWdlci5zaWduQXBwKGRlc2NyaXB0b3IpO1xuXHRcdGNvbnN0IHN0b3JlZCA9IGF3YWl0IHRoaXMuYXBwTWV0YWRhdGFTdG9yYWdlLnVwZGF0ZVBhcnRpYWxBbmRSZXR1cm5Eb2N1bWVudChkZXNjcmlwdG9yLCB7XG5cdFx0XHR1bnNldFBlcm1pc3Npb25zR3JhbnRlZDogdHlwZW9mIHBlcm1pc3Npb25zR3JhbnRlZCA9PT0gJ3VuZGVmaW5lZCcsXG5cdFx0fSk7XG5cblx0XHQvLyBFcnJvcnMgaGVyZSBkb24ndCByZWFsbHkgcHJldmVudCB0aGUgcHJvY2VzcyBmcm9tIGR5aW5nLCBzbyB3ZSBkb24ndCByZWFsbHkgbmVlZCB0byBkbyBhbnl0aGluZyBvbiB0aGUgY2F0Y2hcblx0XHRhd2FpdCB0aGlzLmdldFJ1bnRpbWUoKVxuXHRcdFx0LnN0b3BSdW50aW1lKHRoaXMuYXBwcy5nZXQob2xkLmlkKS5nZXRSdW50aW1lQ29udHJvbGxlcigpKVxuXHRcdFx0LmNhdGNoKCgpID0+IHt9KTtcblxuXHRcdGNvbnN0IGFwcCA9IGF3YWl0IHRoaXMuZ2V0Q29tcGlsZXIoKS50b1NhbmRCb3godGhpcywgZGVzY3JpcHRvciwgcmVzdWx0KTtcblxuXHRcdC8vIEVuc3VyZSB0aGVyZSBpcyBhbiB1c2VyIGZvciB0aGUgYXBwXG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IHRoaXMuY3JlYXRlQXBwVXNlcihyZXN1bHQuaW5mbyk7XG5cdFx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0XHRhZmYuc2V0QXBwVXNlckVycm9yKHtcblx0XHRcdFx0dXNlcm5hbWU6IGAke3Jlc3VsdC5pbmZvLm5hbWVTbHVnfS5ib3RgLFxuXHRcdFx0XHRtZXNzYWdlOiAnRmFpbGVkIHRvIGNyZWF0ZSBhbiBhcHAgdXNlciBmb3IgdGhpcyBhcHAuJyxcblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gYWZmO1xuXHRcdH1cblxuXHRcdGFmZi5zZXRBcHAoYXBwKTtcblxuXHRcdGlmICh1cGRhdGVPcHRpb25zLmxvYWRBcHApIHtcblx0XHRcdGNvbnN0IHNob3VsZEVuYWJsZUFwcCA9IEFwcFN0YXR1c1V0aWxzLmlzRW5hYmxlZChvbGQuc3RhdHVzKTtcblx0XHRcdGlmIChzaG91bGRFbmFibGVBcHApIHtcblx0XHRcdFx0YXdhaXQgdGhpcy51cGRhdGVBbmRTdGFydHVwTG9jYWwoc3RvcmVkLCBhcHApO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0YXdhaXQgdGhpcy51cGRhdGVBbmRJbml0aWFsaXplTG9jYWwoc3RvcmVkLCBhcHApO1xuXHRcdFx0fVxuXG5cdFx0XHRhd2FpdCB0aGlzLmJyaWRnZXNcblx0XHRcdFx0LmdldEFwcEFjdGl2YXRpb25CcmlkZ2UoKVxuXHRcdFx0XHQuZG9BcHBVcGRhdGVkKGFwcClcblx0XHRcdFx0LmNhdGNoKCgpID0+IHt9KTtcblx0XHR9XG5cblx0XHRhd2FpdCB0aGlzLnVwZGF0ZUFwcChhcHAsIHVwZGF0ZU9wdGlvbnMudXNlciwgb2xkLmluZm8udmVyc2lvbik7XG5cblx0XHRyZXR1cm4gYWZmO1xuXHR9XG5cblx0LyoqXG5cdCAqIFVwZGF0ZXMgdGhlIGxvY2FsIGluc3RhbmNlIG9mIGFuIGFwcC5cblx0ICpcblx0ICogSWYgdGhlIHNlY29uZCBwYXJhbWV0ZXIgaXMgYSBCdWZmZXIgb2YgYW4gYXBwIHBhY2thZ2UsXG5cdCAqIHVucGFja2FnZSBhbmQgaW5zdGFudGlhdGUgdGhlIGFwcCdzIG1haW4gY2xhc3Ncblx0ICpcblx0ICogV2l0aCBhbiBpbnN0YW5jZSBvZiBhIFByb3hpZWRBcHAsIHN0YXJ0IGl0IHVwIGFuZCByZXBsYWNlXG5cdCAqIHRoZSByZWZlcmVuY2UgaW4gdGhlIGxvY2FsIGFwcCBjb2xsZWN0aW9uXG5cdCAqL1xuXHRhc3luYyB1cGRhdGVMb2NhbChzdG9yZWQ6IElBcHBTdG9yYWdlSXRlbSwgYXBwUGFja2FnZU9ySW5zdGFuY2U6IFByb3hpZWRBcHAgfCBCdWZmZXIpOiBQcm9taXNlPFByb3hpZWRBcHA+IHtcblx0XHRjb25zdCBhcHAgPSBhd2FpdCAoYXN5bmMgKCkgPT4ge1xuXHRcdFx0aWYgKGFwcFBhY2thZ2VPckluc3RhbmNlIGluc3RhbmNlb2YgQnVmZmVyKSB7XG5cdFx0XHRcdGNvbnN0IHBhcnNlUmVzdWx0ID0gYXdhaXQgdGhpcy5nZXRQYXJzZXIoKS51bnBhY2thZ2VBcHAoYXBwUGFja2FnZU9ySW5zdGFuY2UpO1xuXG5cdFx0XHRcdC8vIEVycm9ycyBoZXJlIGRvbid0IHJlYWxseSBwcmV2ZW50IHRoZSBwcm9jZXNzIGZyb20gZHlpbmcsIHNvIHdlIGRvbid0IHJlYWxseSBuZWVkIHRvIGRvIGFueXRoaW5nIG9uIHRoZSBjYXRjaFxuXHRcdFx0XHRhd2FpdCB0aGlzLmdldFJ1bnRpbWUoKVxuXHRcdFx0XHRcdC5zdG9wUnVudGltZSh0aGlzLmFwcHMuZ2V0KHN0b3JlZC5pZCkuZ2V0UnVudGltZUNvbnRyb2xsZXIoKSlcblx0XHRcdFx0XHQuY2F0Y2goKCkgPT4ge30pO1xuXG5cdFx0XHRcdHJldHVybiB0aGlzLmdldENvbXBpbGVyKCkudG9TYW5kQm94KHRoaXMsIHN0b3JlZCwgcGFyc2VSZXN1bHQpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoYXBwUGFja2FnZU9ySW5zdGFuY2UgaW5zdGFuY2VvZiBQcm94aWVkQXBwKSB7XG5cdFx0XHRcdHJldHVybiBhcHBQYWNrYWdlT3JJbnN0YW5jZTtcblx0XHRcdH1cblx0XHR9KSgpO1xuXG5cdFx0Ly8gV2UgZG9uJ3Qga2VlcCBzbGFzaGNvbW1hbmRzIGhlcmUgYXMgdGhlIHVwZGF0ZSBjb3VsZCBwb3RlbnRpYWxseSBub3QgcHJvdmlkZSB0aGUgc2FtZSBsaXN0XG5cdFx0YXdhaXQgdGhpcy5wdXJnZUFwcENvbmZpZyhhcHAsIHsga2VlcFNjaGVkdWxlZEpvYnM6IHRydWUgfSk7XG5cblx0XHR0aGlzLmFwcHMuc2V0KGFwcC5nZXRJRCgpLCBhcHApO1xuXHRcdHJldHVybiBhcHA7XG5cdH1cblxuXHRwdWJsaWMgYXN5bmMgdXBkYXRlQW5kU3RhcnR1cExvY2FsKHN0b3JlZDogSUFwcFN0b3JhZ2VJdGVtLCBhcHBQYWNrYWdlT3JJbnN0YW5jZTogUHJveGllZEFwcCB8IEJ1ZmZlcikge1xuXHRcdGNvbnN0IGFwcCA9IGF3YWl0IHRoaXMudXBkYXRlTG9jYWwoc3RvcmVkLCBhcHBQYWNrYWdlT3JJbnN0YW5jZSk7XG5cdFx0YXdhaXQgdGhpcy5ydW5TdGFydFVwUHJvY2VzcyhzdG9yZWQsIGFwcCwgdHJ1ZSk7XG5cdH1cblxuXHRwdWJsaWMgYXN5bmMgdXBkYXRlQW5kSW5pdGlhbGl6ZUxvY2FsKHN0b3JlZDogSUFwcFN0b3JhZ2VJdGVtLCBhcHBQYWNrYWdlT3JJbnN0YW5jZTogUHJveGllZEFwcCB8IEJ1ZmZlcikge1xuXHRcdGNvbnN0IGFwcCA9IGF3YWl0IHRoaXMudXBkYXRlTG9jYWwoc3RvcmVkLCBhcHBQYWNrYWdlT3JJbnN0YW5jZSk7XG5cdFx0YXdhaXQgdGhpcy5pbml0aWFsaXplQXBwKGFwcCwgdHJ1ZSk7XG5cdH1cblxuXHRwdWJsaWMgZ2V0TGFuZ3VhZ2VDb250ZW50KCk6IHsgW2tleTogc3RyaW5nXTogb2JqZWN0IH0ge1xuXHRcdGNvbnN0IGxhbmdzOiB7IFtrZXk6IHN0cmluZ106IG9iamVjdCB9ID0ge307XG5cblx0XHR0aGlzLmFwcHMuZm9yRWFjaCgocmwpID0+IHtcblx0XHRcdGNvbnN0IGNvbnRlbnQgPSBybC5nZXRTdG9yYWdlSXRlbSgpLmxhbmd1YWdlQ29udGVudDtcblxuXHRcdFx0T2JqZWN0LmtleXMoY29udGVudCkuZm9yRWFjaCgoa2V5KSA9PiB7XG5cdFx0XHRcdGxhbmdzW2tleV0gPSBPYmplY3QuYXNzaWduKGxhbmdzW2tleV0gfHwge30sIGNvbnRlbnRba2V5XSk7XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBsYW5ncztcblx0fVxuXG5cdHB1YmxpYyBhc3luYyBjaGFuZ2VTdGF0dXMoYXBwSWQ6IHN0cmluZywgc3RhdHVzOiBBcHBTdGF0dXMpOiBQcm9taXNlPFByb3hpZWRBcHA+IHtcblx0XHRzd2l0Y2ggKHN0YXR1cykge1xuXHRcdFx0Y2FzZSBBcHBTdGF0dXMuTUFOVUFMTFlfRElTQUJMRUQ6XG5cdFx0XHRjYXNlIEFwcFN0YXR1cy5NQU5VQUxMWV9FTkFCTEVEOlxuXHRcdFx0XHRicmVhaztcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBzdGF0dXMgdG8gY2hhbmdlIGFuIEFwcCB0bywgbXVzdCBiZSBtYW51YWxseSBkaXNhYmxlZCBvciBlbmFibGVkLicpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHJsID0gdGhpcy5hcHBzLmdldChhcHBJZCk7XG5cblx0XHRpZiAoIXJsKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0NhbiBub3QgY2hhbmdlIHRoZSBzdGF0dXMgb2YgYW4gQXBwIHdoaWNoIGRvZXMgbm90IGN1cnJlbnRseSBleGlzdC4nKTtcblx0XHR9XG5cblx0XHRjb25zdCBzdG9yYWdlSXRlbSA9IGF3YWl0IHJsLmdldFN0b3JhZ2VJdGVtKCk7XG5cblx0XHRpZiAoQXBwU3RhdHVzVXRpbHMuaXNFbmFibGVkKHN0YXR1cykpIHtcblx0XHRcdC8vIFRoZW4gZW5hYmxlIGl0XG5cdFx0XHRpZiAoQXBwU3RhdHVzVXRpbHMuaXNFbmFibGVkKGF3YWl0IHJsLmdldFN0YXR1cygpKSkge1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0NhbiBub3QgZW5hYmxlIGFuIEFwcCB3aGljaCBpcyBhbHJlYWR5IGVuYWJsZWQuJyk7XG5cdFx0XHR9XG5cblx0XHRcdGF3YWl0IHRoaXMuZW5hYmxlKHJsLmdldElEKCkpO1xuXG5cdFx0XHRzdG9yYWdlSXRlbS5zdGF0dXMgPSBBcHBTdGF0dXMuTUFOVUFMTFlfRU5BQkxFRDtcblx0XHRcdGF3YWl0IHRoaXMuYXBwTWV0YWRhdGFTdG9yYWdlLnVwZGF0ZVN0YXR1cyhzdG9yYWdlSXRlbS5faWQsIEFwcFN0YXR1cy5NQU5VQUxMWV9FTkFCTEVEKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYgKCFBcHBTdGF0dXNVdGlscy5pc0VuYWJsZWQoYXdhaXQgcmwuZ2V0U3RhdHVzKCkpKSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcignQ2FuIG5vdCBkaXNhYmxlIGFuIEFwcCB3aGljaCBpcyBub3QgZW5hYmxlZC4nKTtcblx0XHRcdH1cblxuXHRcdFx0YXdhaXQgdGhpcy5kaXNhYmxlKHJsLmdldElEKCksIEFwcFN0YXR1cy5NQU5VQUxMWV9ESVNBQkxFRCk7XG5cblx0XHRcdHN0b3JhZ2VJdGVtLnN0YXR1cyA9IEFwcFN0YXR1cy5NQU5VQUxMWV9ESVNBQkxFRDtcblx0XHRcdGF3YWl0IHRoaXMuYXBwTWV0YWRhdGFTdG9yYWdlLnVwZGF0ZVN0YXR1cyhzdG9yYWdlSXRlbS5faWQsIEFwcFN0YXR1cy5NQU5VQUxMWV9ESVNBQkxFRCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJsO1xuXHR9XG5cblx0cHVibGljIGFzeW5jIHVwZGF0ZUFwcHNNYXJrZXRwbGFjZUluZm8oYXBwc092ZXJ2aWV3OiBBcnJheTx7IGxhdGVzdDogSU1hcmtldHBsYWNlSW5mbyB9Pik6IFByb21pc2U8dm9pZD4ge1xuXHRcdGF3YWl0IFByb21pc2UuYWxsKFxuXHRcdFx0YXBwc092ZXJ2aWV3Lm1hcChhc3luYyAoeyBsYXRlc3Q6IGFwcEluZm8gfSkgPT4ge1xuXHRcdFx0XHRpZiAoIWFwcEluZm8uc3Vic2NyaXB0aW9uSW5mbykge1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNvbnN0IGFwcCA9IHRoaXMuYXBwcy5nZXQoYXBwSW5mby5pZCk7XG5cblx0XHRcdFx0aWYgKCFhcHApIHtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zdCBhcHBTdG9yYWdlSXRlbSA9IGFwcC5nZXRTdG9yYWdlSXRlbSgpO1xuXHRcdFx0XHRjb25zdCB7IHN1YnNjcmlwdGlvbkluZm8gfSA9IGFwcFN0b3JhZ2VJdGVtLm1hcmtldHBsYWNlSW5mbz8uWzBdIHx8IHt9O1xuXG5cdFx0XHRcdGlmIChzdWJzY3JpcHRpb25JbmZvICYmIHN1YnNjcmlwdGlvbkluZm8ubGljZW5zZS5saWNlbnNlID09PSBhcHBJbmZvLnN1YnNjcmlwdGlvbkluZm8ubGljZW5zZS5saWNlbnNlKSB7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0YXBwU3RvcmFnZUl0ZW0ubWFya2V0cGxhY2VJbmZvWzBdLnN1YnNjcmlwdGlvbkluZm8gPSBhcHBJbmZvLnN1YnNjcmlwdGlvbkluZm87XG5cdFx0XHRcdGFwcFN0b3JhZ2VJdGVtLnNpZ25hdHVyZSA9IGF3YWl0IHRoaXMuZ2V0U2lnbmF0dXJlTWFuYWdlcigpLnNpZ25BcHAoYXBwU3RvcmFnZUl0ZW0pO1xuXG5cdFx0XHRcdHJldHVybiB0aGlzLmFwcE1ldGFkYXRhU3RvcmFnZS51cGRhdGVQYXJ0aWFsQW5kUmV0dXJuRG9jdW1lbnQoe1xuXHRcdFx0XHRcdF9pZDogYXBwU3RvcmFnZUl0ZW0uX2lkLFxuXHRcdFx0XHRcdG1hcmtldHBsYWNlSW5mbzogYXBwU3RvcmFnZUl0ZW0ubWFya2V0cGxhY2VJbmZvLFxuXHRcdFx0XHRcdHNpZ25hdHVyZTogYXBwU3RvcmFnZUl0ZW0uc2lnbmF0dXJlLFxuXHRcdFx0XHR9KTtcblx0XHRcdH0pLFxuXHRcdCkuY2F0Y2goKCkgPT4ge30pO1xuXG5cdFx0Y29uc3QgcXVldWUgPSBbXSBhcyBBcnJheTxQcm9taXNlPHZvaWQ+PjtcblxuXHRcdHRoaXMuYXBwcy5mb3JFYWNoKChhcHApID0+XG5cdFx0XHRxdWV1ZS5wdXNoKFxuXHRcdFx0XHRhcHBcblx0XHRcdFx0XHQudmFsaWRhdGVMaWNlbnNlKClcblx0XHRcdFx0XHQudGhlbihhc3luYyAoKSA9PiB7XG5cdFx0XHRcdFx0XHRpZiAoKGF3YWl0IGFwcC5nZXRTdGF0dXMoKSkgIT09IEFwcFN0YXR1cy5JTlZBTElEX0xJQ0VOU0VfRElTQUJMRUQpIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRyZXR1cm4gYXBwLnNldFN0YXR1cyhBcHBTdGF0dXMuRElTQUJMRUQpO1xuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0LmNhdGNoKGFzeW5jIChlcnJvcikgPT4ge1xuXHRcdFx0XHRcdFx0aWYgKCEoZXJyb3IgaW5zdGFuY2VvZiBJbnZhbGlkTGljZW5zZUVycm9yKSkge1xuXHRcdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKGVycm9yKTtcblx0XHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRhd2FpdCB0aGlzLnB1cmdlQXBwQ29uZmlnKGFwcCwgeyBrZWVwU2NoZWR1bGVkSm9iczogdHJ1ZSB9KTtcblxuXHRcdFx0XHRcdFx0cmV0dXJuIGFwcC5zZXRTdGF0dXMoQXBwU3RhdHVzLklOVkFMSURfTElDRU5TRV9ESVNBQkxFRCk7XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQudGhlbihhc3luYyAoKSA9PiB7XG5cdFx0XHRcdFx0XHRjb25zdCBzdGF0dXMgPSBhd2FpdCBhcHAuZ2V0U3RhdHVzKCk7XG5cdFx0XHRcdFx0XHRpZiAoc3RhdHVzID09PSBhcHAuZ2V0UHJldmlvdXNTdGF0dXMoKSkge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGNvbnN0IHN0b3JhZ2VJdGVtID0gYXBwLmdldFN0b3JhZ2VJdGVtKCk7XG5cdFx0XHRcdFx0XHRzdG9yYWdlSXRlbS5zdGF0dXMgPSBzdGF0dXM7XG5cblx0XHRcdFx0XHRcdHJldHVybiB0aGlzLmFwcE1ldGFkYXRhU3RvcmFnZS51cGRhdGVTdGF0dXMoc3RvcmFnZUl0ZW0uX2lkLCBzdG9yYWdlSXRlbS5zdGF0dXMpLmNhdGNoKGNvbnNvbGUuZXJyb3IpIGFzIFByb21pc2U8dm9pZD47XG5cdFx0XHRcdFx0fSksXG5cdFx0XHQpLFxuXHRcdCk7XG5cblx0XHRhd2FpdCBQcm9taXNlLmFsbChxdWV1ZSk7XG5cdH1cblxuXHQvKipcblx0ICogR29lcyB0aHJvdWdoIHRoZSBlbnRpcmUgbG9hZGluZyB1cCBwcm9jZXNzLlxuXHQgKlxuXHQgKiBAcGFyYW0gYXBwSWQgdGhlIGlkIG9mIHRoZSBhcHBsaWNhdGlvbiB0byBsb2FkXG5cdCAqL1xuXHRwdWJsaWMgYXN5bmMgbG9hZE9uZShhcHBJZDogc3RyaW5nLCBzaWxlbmNlU3RhdHVzID0gZmFsc2UpOiBQcm9taXNlPFByb3hpZWRBcHA+IHtcblx0XHRjb25zdCBybCA9IHRoaXMuYXBwcy5nZXQoYXBwSWQpO1xuXG5cdFx0aWYgKCFybCkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBObyBBcHAgZm91bmQgYnkgdGhlIGlkIG9mOiBcIiR7YXBwSWR9XCJgKTtcblx0XHR9XG5cblx0XHRjb25zdCBpdGVtID0gcmwuZ2V0U3RvcmFnZUl0ZW0oKTtcblxuXHRcdGF3YWl0IHRoaXMuaW5pdGlhbGl6ZUFwcChybCwgc2lsZW5jZVN0YXR1cyk7XG5cblx0XHRpZiAoIXRoaXMuYXJlUmVxdWlyZWRTZXR0aW5nc1NldChpdGVtKSkge1xuXHRcdFx0YXdhaXQgcmwuc2V0U3RhdHVzKEFwcFN0YXR1cy5JTlZBTElEX1NFVFRJTkdTX0RJU0FCTEVEKTtcblx0XHR9XG5cblx0XHRpZiAoIUFwcFN0YXR1c1V0aWxzLmlzRGlzYWJsZWQoYXdhaXQgcmwuZ2V0U3RhdHVzKCkpICYmIEFwcFN0YXR1c1V0aWxzLmlzRW5hYmxlZChybC5nZXRQcmV2aW91c1N0YXR1cygpKSkge1xuXHRcdFx0YXdhaXQgdGhpcy5lbmFibGVBcHAocmwsIHNpbGVuY2VTdGF0dXMpO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzLmFwcHMuZ2V0KGl0ZW0uaWQpO1xuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBydW5TdGFydFVwUHJvY2VzcyhzdG9yYWdlSXRlbTogSUFwcFN0b3JhZ2VJdGVtLCBhcHA6IFByb3hpZWRBcHAsIHNpbGVuY2VTdGF0dXM6IGJvb2xlYW4pOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0XHRpZiAoKGF3YWl0IGFwcC5nZXRTdGF0dXMoKSkgIT09IEFwcFN0YXR1cy5JTklUSUFMSVpFRCkge1xuXHRcdFx0Y29uc3QgaXNJbml0aWFsaXplZCA9IGF3YWl0IHRoaXMuaW5pdGlhbGl6ZUFwcChhcHAsIHNpbGVuY2VTdGF0dXMpO1xuXHRcdFx0aWYgKCFpc0luaXRpYWxpemVkKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoIXRoaXMuYXJlUmVxdWlyZWRTZXR0aW5nc1NldChzdG9yYWdlSXRlbSkpIHtcblx0XHRcdGF3YWl0IGFwcC5zZXRTdGF0dXMoQXBwU3RhdHVzLklOVkFMSURfU0VUVElOR1NfRElTQUJMRUQsIHNpbGVuY2VTdGF0dXMpO1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzLmVuYWJsZUFwcChhcHAsIHNpbGVuY2VTdGF0dXMpO1xuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBpbnN0YWxsQXBwKGFwcDogUHJveGllZEFwcCwgdXNlcjogSVVzZXIpOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0XHRsZXQgcmVzdWx0OiBib29sZWFuO1xuXHRcdGNvbnN0IGNvbnRleHQgPSB7IHVzZXIgfTtcblxuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCBhcHAuY2FsbChBcHBNZXRob2QuT05JTlNUQUxMLCBjb250ZXh0KTtcblxuXHRcdFx0cmVzdWx0ID0gdHJ1ZTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRjb25zdCBzdGF0dXMgPSBBcHBTdGF0dXMuRVJST1JfRElTQUJMRUQ7XG5cblx0XHRcdHJlc3VsdCA9IGZhbHNlO1xuXG5cdFx0XHRhd2FpdCBhcHAuc2V0U3RhdHVzKHN0YXR1cyk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgdXBkYXRlQXBwKGFwcDogUHJveGllZEFwcCwgdXNlcjogSVVzZXIgfCBudWxsLCBvbGRBcHBWZXJzaW9uOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0XHRsZXQgcmVzdWx0OiBib29sZWFuO1xuXG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IGFwcC5jYWxsKEFwcE1ldGhvZC5PTlVQREFURSwgeyBvbGRBcHBWZXJzaW9uLCB1c2VyIH0pO1xuXG5cdFx0XHRyZXN1bHQgPSB0cnVlO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGNvbnN0IHN0YXR1cyA9IEFwcFN0YXR1cy5FUlJPUl9ESVNBQkxFRDtcblxuXHRcdFx0cmVzdWx0ID0gZmFsc2U7XG5cblx0XHRcdGF3YWl0IGFwcC5zZXRTdGF0dXMoc3RhdHVzKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gcmVzdWx0O1xuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBpbml0aWFsaXplQXBwKGFwcDogUHJveGllZEFwcCwgc2lsZW5jZVN0YXR1cyA9IGZhbHNlKTogUHJvbWlzZTxib29sZWFuPiB7XG5cdFx0bGV0IHJlc3VsdDogYm9vbGVhbjtcblxuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCBhcHAudmFsaWRhdGVMaWNlbnNlKCk7XG5cdFx0XHRhd2FpdCBhcHAudmFsaWRhdGVJbnN0YWxsYXRpb24oKTtcblxuXHRcdFx0YXdhaXQgYXBwLmNhbGwoQXBwTWV0aG9kLklOSVRJQUxJWkUpO1xuXHRcdFx0YXdhaXQgYXBwLnNldFN0YXR1cyhBcHBTdGF0dXMuSU5JVElBTElaRUQsIHNpbGVuY2VTdGF0dXMpO1xuXG5cdFx0XHRhd2FpdCB0aGlzLmNvbW1hbmRNYW5hZ2VyLnJlZ2lzdGVyQ29tbWFuZHMoYXBwLmdldElEKCkpO1xuXG5cdFx0XHRyZXN1bHQgPSB0cnVlO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGxldCBzdGF0dXMgPSBBcHBTdGF0dXMuRVJST1JfRElTQUJMRUQ7XG5cblx0XHRcdGlmIChlIGluc3RhbmNlb2YgSW52YWxpZExpY2Vuc2VFcnJvcikge1xuXHRcdFx0XHRzdGF0dXMgPSBBcHBTdGF0dXMuSU5WQUxJRF9MSUNFTlNFX0RJU0FCTEVEO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZSBpbnN0YW5jZW9mIEludmFsaWRJbnN0YWxsYXRpb25FcnJvcikge1xuXHRcdFx0XHRzdGF0dXMgPSBBcHBTdGF0dXMuSU5WQUxJRF9JTlNUQUxMQVRJT05fRElTQUJMRUQ7XG5cdFx0XHR9XG5cblx0XHRcdGF3YWl0IHRoaXMucHVyZ2VBcHBDb25maWcoYXBwKTtcblx0XHRcdHJlc3VsdCA9IGZhbHNlO1xuXG5cdFx0XHRhd2FpdCBhcHAuc2V0U3RhdHVzKHN0YXR1cywgc2lsZW5jZVN0YXR1cyk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgcHVyZ2VBcHBDb25maWcoYXBwOiBQcm94aWVkQXBwLCBvcHRzOiBJUHVyZ2VBcHBDb25maWdPcHRzID0ge30pIHtcblx0XHRpZiAoIW9wdHMua2VlcFNjaGVkdWxlZEpvYnMpIHtcblx0XHRcdGF3YWl0IHRoaXMuc2NoZWR1bGVyTWFuYWdlci5jbGVhblVwKGFwcC5nZXRJRCgpKTtcblx0XHR9XG5cblx0XHRpZiAoIW9wdHMua2VlcFNsYXNoY29tbWFuZHMpIHtcblx0XHRcdGF3YWl0IHRoaXMuY29tbWFuZE1hbmFnZXIudW5yZWdpc3RlckNvbW1hbmRzKGFwcC5nZXRJRCgpKTtcblx0XHR9XG5cblx0XHR0aGlzLmxpc3RlbmVyTWFuYWdlci51bnJlZ2lzdGVyTGlzdGVuZXJzKGFwcCk7XG5cdFx0dGhpcy5saXN0ZW5lck1hbmFnZXIubG9ja0Vzc2VudGlhbEV2ZW50cyhhcHApO1xuXHRcdHRoaXMuZXh0ZXJuYWxDb21wb25lbnRNYW5hZ2VyLnVucmVnaXN0ZXJFeHRlcm5hbENvbXBvbmVudHMoYXBwLmdldElEKCkpO1xuXHRcdGF3YWl0IHRoaXMuYXBpTWFuYWdlci51bnJlZ2lzdGVyQXBpcyhhcHAuZ2V0SUQoKSk7XG5cdFx0dGhpcy5hY2Nlc3Nvck1hbmFnZXIucHVyaWZ5QXBwKGFwcC5nZXRJRCgpKTtcblx0XHR0aGlzLnVpQWN0aW9uQnV0dG9uTWFuYWdlci5jbGVhckFwcEFjdGlvbkJ1dHRvbnMoYXBwLmdldElEKCkpO1xuXHRcdHRoaXMudmlkZW9Db25mUHJvdmlkZXJNYW5hZ2VyLnVucmVnaXN0ZXJQcm92aWRlcnMoYXBwLmdldElEKCkpO1xuXHRcdGF3YWl0IHRoaXMub3V0Ym91bmRDb21tdW5pY2F0aW9uUHJvdmlkZXJNYW5hZ2VyLnVucmVnaXN0ZXJQcm92aWRlcnMoYXBwLmdldElEKCksIHtcblx0XHRcdGtlZXBSZWZlcmVuY2VzOiBvcHRzLmtlZXBPdXRib3VuZENvbW11bmljYXRpb25Qcm92aWRlcnMsXG5cdFx0fSk7XG5cdH1cblxuXHQvKipcblx0ICogRGV0ZXJtaW5lcyBpZiB0aGUgQXBwJ3MgcmVxdWlyZWQgc2V0dGluZ3MgYXJlIHNldCBvciBub3QuXG5cdCAqIFNob3VsZCBhIHBhY2thZ2VWYWx1ZSBiZSBwcm92aWRlZCBhbmQgbm90IGVtcHR5LCB0aGVuIGl0J3MgY29uc2lkZXJlZCBzZXQuXG5cdCAqL1xuXHRwcml2YXRlIGFyZVJlcXVpcmVkU2V0dGluZ3NTZXQoc3RvcmFnZUl0ZW06IElBcHBTdG9yYWdlSXRlbSk6IGJvb2xlYW4ge1xuXHRcdGxldCByZXN1bHQgPSB0cnVlO1xuXG5cdFx0Zm9yIChjb25zdCBzZXRrIG9mIE9iamVjdC5rZXlzKHN0b3JhZ2VJdGVtLnNldHRpbmdzKSkge1xuXHRcdFx0Y29uc3Qgc2V0dCA9IHN0b3JhZ2VJdGVtLnNldHRpbmdzW3NldGtdO1xuXHRcdFx0Ly8gSWYgaXQncyBub3QgcmVxdWlyZWQsIGlnbm9yZVxuXHRcdFx0aWYgKCFzZXR0LnJlcXVpcmVkKSB7XG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoc2V0dC52YWx1ZSAhPT0gJ3VuZGVmaW5lZCcgfHwgc2V0dC5wYWNrYWdlVmFsdWUgIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXN1bHQgPSBmYWxzZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gcmVzdWx0O1xuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBlbmFibGVBcHAoYXBwOiBQcm94aWVkQXBwLCBzaWxlbmNlU3RhdHVzID0gZmFsc2UpOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0XHRsZXQgZW5hYmxlOiBib29sZWFuO1xuXHRcdGxldCBzdGF0dXMgPSBBcHBTdGF0dXMuRVJST1JfRElTQUJMRUQ7XG5cblx0XHR0cnkge1xuXHRcdFx0YXdhaXQgYXBwLnZhbGlkYXRlTGljZW5zZSgpO1xuXHRcdFx0YXdhaXQgYXBwLnZhbGlkYXRlSW5zdGFsbGF0aW9uKCk7XG5cblx0XHRcdGVuYWJsZSA9IChhd2FpdCBhcHAuY2FsbChBcHBNZXRob2QuT05FTkFCTEUpKSBhcyBib29sZWFuO1xuXG5cdFx0XHRpZiAoZW5hYmxlKSB7XG5cdFx0XHRcdHN0YXR1cyA9IEFwcFN0YXR1cy5NQU5VQUxMWV9FTkFCTEVEO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0c3RhdHVzID0gQXBwU3RhdHVzLkRJU0FCTEVEO1xuXHRcdFx0XHRjb25zb2xlLndhcm4oYFRoZSBBcHAgKCR7YXBwLmdldElEKCl9KSBkaXNhYmxlZCBpdHNlbGYgd2hlbiBiZWluZyBlbmFibGVkLiBcXG5DaGVjayB0aGUgXCJvbkVuYWJsZVwiIGltcGxlbWVudGF0aW9uIGZvciBkZXRhaWxzLmApO1xuXHRcdFx0fVxuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGVuYWJsZSA9IGZhbHNlO1xuXG5cdFx0XHRpZiAoZSBpbnN0YW5jZW9mIEludmFsaWRMaWNlbnNlRXJyb3IpIHtcblx0XHRcdFx0c3RhdHVzID0gQXBwU3RhdHVzLklOVkFMSURfTElDRU5TRV9ESVNBQkxFRDtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGUgaW5zdGFuY2VvZiBJbnZhbGlkSW5zdGFsbGF0aW9uRXJyb3IpIHtcblx0XHRcdFx0c3RhdHVzID0gQXBwU3RhdHVzLklOVkFMSURfSU5TVEFMTEFUSU9OX0RJU0FCTEVEO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zb2xlLmVycm9yKGUpO1xuXHRcdH1cblxuXHRcdGlmIChlbmFibGUpIHtcblx0XHRcdHRoaXMuZXh0ZXJuYWxDb21wb25lbnRNYW5hZ2VyLnJlZ2lzdGVyRXh0ZXJuYWxDb21wb25lbnRzKGFwcC5nZXRJRCgpKTtcblx0XHRcdGF3YWl0IHRoaXMuYXBpTWFuYWdlci5yZWdpc3RlckFwaXMoYXBwLmdldElEKCkpO1xuXHRcdFx0dGhpcy5saXN0ZW5lck1hbmFnZXIucmVnaXN0ZXJMaXN0ZW5lcnMoYXBwKTtcblx0XHRcdHRoaXMubGlzdGVuZXJNYW5hZ2VyLnJlbGVhc2VFc3NlbnRpYWxFdmVudHMoYXBwKTtcblx0XHRcdHRoaXMudmlkZW9Db25mUHJvdmlkZXJNYW5hZ2VyLnJlZ2lzdGVyUHJvdmlkZXJzKGFwcC5nZXRJRCgpKTtcblx0XHRcdGF3YWl0IHRoaXMub3V0Ym91bmRDb21tdW5pY2F0aW9uUHJvdmlkZXJNYW5hZ2VyLnJlZ2lzdGVyUHJvdmlkZXJzKGFwcC5nZXRJRCgpKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0YXdhaXQgdGhpcy5wdXJnZUFwcENvbmZpZyhhcHAsIHtcblx0XHRcdFx0a2VlcFNjaGVkdWxlZEpvYnM6IHRydWUsXG5cdFx0XHRcdGtlZXBTbGFzaGNvbW1hbmRzOiB0cnVlLFxuXHRcdFx0XHRrZWVwT3V0Ym91bmRDb21tdW5pY2F0aW9uUHJvdmlkZXJzOiB0cnVlLFxuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0YXdhaXQgYXBwLnNldFN0YXR1cyhzdGF0dXMsIHNpbGVuY2VTdGF0dXMpO1xuXG5cdFx0cmV0dXJuIGVuYWJsZTtcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgY3JlYXRlQXBwVXNlcihhcHBJbmZvOiBJQXBwSW5mbyk6IFByb21pc2U8c3RyaW5nPiB7XG5cdFx0Y29uc3QgYXBwVXNlciA9IGF3YWl0ICh0aGlzLmJyaWRnZXMuZ2V0VXNlckJyaWRnZSgpIGFzIElJbnRlcm5hbFVzZXJCcmlkZ2UgJiBVc2VyQnJpZGdlKS5nZXRBcHBVc2VyKGFwcEluZm8uaWQpO1xuXG5cdFx0aWYgKGFwcFVzZXIpIHtcblx0XHRcdHJldHVybiBhcHBVc2VyLmlkO1xuXHRcdH1cblxuXHRcdGNvbnN0IHVzZXJEYXRhOiBQYXJ0aWFsPElVc2VyPiA9IHtcblx0XHRcdHVzZXJuYW1lOiBgJHthcHBJbmZvLm5hbWVTbHVnfS5ib3RgLFxuXHRcdFx0bmFtZTogYXBwSW5mby5uYW1lLFxuXHRcdFx0cm9sZXM6IFsnYXBwJ10sXG5cdFx0XHRhcHBJZDogYXBwSW5mby5pZCxcblx0XHRcdHR5cGU6IFVzZXJUeXBlLkFQUCxcblx0XHRcdHN0YXR1czogJ29ubGluZScsXG5cdFx0XHRpc0VuYWJsZWQ6IHRydWUsXG5cdFx0fTtcblxuXHRcdHJldHVybiAodGhpcy5icmlkZ2VzLmdldFVzZXJCcmlkZ2UoKSBhcyBJSW50ZXJuYWxVc2VyQnJpZGdlICYgVXNlckJyaWRnZSkuY3JlYXRlKHVzZXJEYXRhLCBhcHBJbmZvLmlkLCB7XG5cdFx0XHRhdmF0YXJVcmw6IGFwcEluZm8uaWNvbkZpbGVDb250ZW50IHx8IGFwcEluZm8uaWNvbkZpbGUsXG5cdFx0XHRqb2luRGVmYXVsdENoYW5uZWxzOiB0cnVlLFxuXHRcdFx0c2VuZFdlbGNvbWVFbWFpbDogZmFsc2UsXG5cdFx0fSk7XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHJlbW92ZUFwcFVzZXIoYXBwOiBQcm94aWVkQXBwKTogUHJvbWlzZTxib29sZWFuPiB7XG5cdFx0Y29uc3QgYXBwVXNlciA9IGF3YWl0ICh0aGlzLmJyaWRnZXMuZ2V0VXNlckJyaWRnZSgpIGFzIElJbnRlcm5hbFVzZXJCcmlkZ2UgJiBVc2VyQnJpZGdlKS5nZXRBcHBVc2VyKGFwcC5nZXRJRCgpKTtcblxuXHRcdGlmICghYXBwVXNlcikge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0cmV0dXJuICh0aGlzLmJyaWRnZXMuZ2V0VXNlckJyaWRnZSgpIGFzIElJbnRlcm5hbFVzZXJCcmlkZ2UgJiBVc2VyQnJpZGdlKS5yZW1vdmUoYXBwVXNlciwgYXBwLmdldElEKCkpO1xuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyB1bmluc3RhbGxBcHAoYXBwOiBQcm94aWVkQXBwLCB1c2VyOiBJVXNlcik6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdGxldCByZXN1bHQ6IGJvb2xlYW47XG5cdFx0Y29uc3QgY29udGV4dCA9IHsgdXNlciB9O1xuXG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IGFwcC5jYWxsKEFwcE1ldGhvZC5PTlVOSU5TVEFMTCwgY29udGV4dCk7XG5cblx0XHRcdHJlc3VsdCA9IHRydWU7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0Y29uc3Qgc3RhdHVzID0gQXBwU3RhdHVzLkVSUk9SX0RJU0FCTEVEO1xuXG5cdFx0XHRyZXN1bHQgPSBmYWxzZTtcblxuXHRcdFx0YXdhaXQgYXBwLnNldFN0YXR1cyhzdGF0dXMpO1xuXHRcdH1cblxuXHRcdHJldHVybiByZXN1bHQ7XG5cdH1cbn1cblxuZXhwb3J0IGNvbnN0IGdldFBlcm1pc3Npb25zQnlBcHBJZCA9IChhcHBJZDogc3RyaW5nKSA9PiB7XG5cdGlmICghQXBwTWFuYWdlci5JbnN0YW5jZSkge1xuXHRcdGNvbnNvbGUuZXJyb3IoJ0FwcE1hbmFnZXIgc2hvdWxkIGJlIGluc3RhbnRpYXRlZCBmaXJzdCcpO1xuXHRcdHJldHVybiBbXTtcblx0fVxuXHRyZXR1cm4gQXBwTWFuYWdlci5JbnN0YW5jZS5nZXRQZXJtaXNzaW9uc0J5SWQoYXBwSWQpO1xufTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxTQUFTLE1BQU0sUUFBUSxTQUFTO0FBR2hDLFNBQVMsVUFBVSxRQUFRLGVBQWU7QUFFMUMsU0FBUyxVQUFVLFFBQVEsWUFBWTtBQUN2QyxTQUFTLFNBQVMsRUFBRSxjQUFjLFFBQVEsMEJBQTBCO0FBRXBFLFNBQVMsU0FBUyxRQUFRLHlCQUF5QjtBQUduRCxTQUFTLFFBQVEsUUFBUSxzQkFBc0I7QUFHL0MsU0FBUyxXQUFXLEVBQUUseUJBQXlCLEVBQUUsZ0JBQWdCLFFBQVEsYUFBYTtBQUN0RixTQUFTLG1CQUFtQixRQUFRLFdBQVc7QUFDL0MsU0FBUyx3QkFBd0IsUUFBUSxvQ0FBb0M7QUFDN0UsU0FDQyxrQkFBa0IsRUFDbEIsYUFBYSxFQUNiLDJCQUEyQixFQUMzQixpQkFBaUIsRUFDakIsa0JBQWtCLEVBQ2xCLG1CQUFtQixFQUNuQixrQkFBa0IsRUFDbEIsc0JBQXNCLEVBQ3RCLDJCQUEyQixRQUNyQixhQUFhO0FBQ3BCLFNBQVMsdUNBQXVDLFFBQVEscURBQXFEO0FBQzdHLFNBQVMsaUJBQWlCLFFBQVEsK0JBQStCO0FBQ2pFLFNBQVMsbUJBQW1CLFFBQVEsaUNBQWlDO0FBQ3JFLFNBQVMscUJBQXFCLFFBQVEsbUNBQW1DO0FBRXpFLFNBQVMsa0JBQWtCLFFBQVEsK0JBQStCO0FBQ2xFLFNB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