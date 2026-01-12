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
    this.outboundCommunicationProviderManager = new AppOutboundCommunicationProviderManager(this);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9idWlsZGVyL21lZHNlbnNlLndlYmNoYXQvcGFja2FnZXMvYXBwcy1lbmdpbmUvc3JjL3NlcnZlci9BcHBNYW5hZ2VyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEJ1ZmZlciB9IGZyb20gJ2J1ZmZlcic7XHJcblxyXG5pbXBvcnQgdHlwZSB7IElHZXRBcHBzRmlsdGVyIH0gZnJvbSAnLi9JR2V0QXBwc0ZpbHRlcic7XHJcbmltcG9ydCB7IFByb3hpZWRBcHAgfSBmcm9tICcuL1Byb3hpZWRBcHAnO1xyXG5pbXBvcnQgdHlwZSB7IFBlcnNpc3RlbmNlQnJpZGdlLCBVc2VyQnJpZGdlIH0gZnJvbSAnLi9icmlkZ2VzJztcclxuaW1wb3J0IHsgQXBwQnJpZGdlcyB9IGZyb20gJy4vYnJpZGdlcyc7XHJcbmltcG9ydCB7IEFwcFN0YXR1cywgQXBwU3RhdHVzVXRpbHMgfSBmcm9tICcuLi9kZWZpbml0aW9uL0FwcFN0YXR1cyc7XHJcbmltcG9ydCB0eXBlIHsgSUFwcEluZm8gfSBmcm9tICcuLi9kZWZpbml0aW9uL21ldGFkYXRhJztcclxuaW1wb3J0IHsgQXBwTWV0aG9kIH0gZnJvbSAnLi4vZGVmaW5pdGlvbi9tZXRhZGF0YSc7XHJcbmltcG9ydCB0eXBlIHsgSVBlcm1pc3Npb24gfSBmcm9tICcuLi9kZWZpbml0aW9uL3Blcm1pc3Npb25zL0lQZXJtaXNzaW9uJztcclxuaW1wb3J0IHR5cGUgeyBJVXNlciB9IGZyb20gJy4uL2RlZmluaXRpb24vdXNlcnMnO1xyXG5pbXBvcnQgeyBVc2VyVHlwZSB9IGZyb20gJy4uL2RlZmluaXRpb24vdXNlcnMnO1xyXG5pbXBvcnQgdHlwZSB7IElJbnRlcm5hbFBlcnNpc3RlbmNlQnJpZGdlIH0gZnJvbSAnLi9icmlkZ2VzL0lJbnRlcm5hbFBlcnNpc3RlbmNlQnJpZGdlJztcclxuaW1wb3J0IHR5cGUgeyBJSW50ZXJuYWxVc2VyQnJpZGdlIH0gZnJvbSAnLi9icmlkZ2VzL0lJbnRlcm5hbFVzZXJCcmlkZ2UnO1xyXG5pbXBvcnQgeyBBcHBDb21waWxlciwgQXBwRmFicmljYXRpb25GdWxmaWxsbWVudCwgQXBwUGFja2FnZVBhcnNlciB9IGZyb20gJy4vY29tcGlsZXInO1xyXG5pbXBvcnQgeyBJbnZhbGlkTGljZW5zZUVycm9yIH0gZnJvbSAnLi9lcnJvcnMnO1xyXG5pbXBvcnQgeyBJbnZhbGlkSW5zdGFsbGF0aW9uRXJyb3IgfSBmcm9tICcuL2Vycm9ycy9JbnZhbGlkSW5zdGFsbGF0aW9uRXJyb3InO1xyXG5pbXBvcnQge1xyXG5cdEFwcEFjY2Vzc29yTWFuYWdlcixcclxuXHRBcHBBcGlNYW5hZ2VyLFxyXG5cdEFwcEV4dGVybmFsQ29tcG9uZW50TWFuYWdlcixcclxuXHRBcHBMaWNlbnNlTWFuYWdlcixcclxuXHRBcHBMaXN0ZW5lck1hbmFnZXIsXHJcblx0QXBwU2NoZWR1bGVyTWFuYWdlcixcclxuXHRBcHBTZXR0aW5nc01hbmFnZXIsXHJcblx0QXBwU2xhc2hDb21tYW5kTWFuYWdlcixcclxuXHRBcHBWaWRlb0NvbmZQcm92aWRlck1hbmFnZXIsXHJcbn0gZnJvbSAnLi9tYW5hZ2Vycyc7XHJcbmltcG9ydCB7IEFwcE91dGJvdW5kQ29tbXVuaWNhdGlvblByb3ZpZGVyTWFuYWdlciB9IGZyb20gJy4vbWFuYWdlcnMvQXBwT3V0Ym91bmRDb21tdW5pY2F0aW9uUHJvdmlkZXJNYW5hZ2VyJztcclxuaW1wb3J0IHsgQXBwUnVudGltZU1hbmFnZXIgfSBmcm9tICcuL21hbmFnZXJzL0FwcFJ1bnRpbWVNYW5hZ2VyJztcclxuaW1wb3J0IHsgQXBwU2lnbmF0dXJlTWFuYWdlciB9IGZyb20gJy4vbWFuYWdlcnMvQXBwU2lnbmF0dXJlTWFuYWdlcic7XHJcbmltcG9ydCB7IFVJQWN0aW9uQnV0dG9uTWFuYWdlciB9IGZyb20gJy4vbWFuYWdlcnMvVUlBY3Rpb25CdXR0b25NYW5hZ2VyJztcclxuaW1wb3J0IHR5cGUgeyBJTWFya2V0cGxhY2VJbmZvIH0gZnJvbSAnLi9tYXJrZXRwbGFjZSc7XHJcbmltcG9ydCB7IGRlZmF1bHRQZXJtaXNzaW9ucyB9IGZyb20gJy4vcGVybWlzc2lvbnMvQXBwUGVybWlzc2lvbnMnO1xyXG5pbXBvcnQgeyBFbXB0eVJ1bnRpbWUgfSBmcm9tICcuL3J1bnRpbWUvRW1wdHlSdW50aW1lJztcclxuaW1wb3J0IHR5cGUgeyBJQXBwU3RvcmFnZUl0ZW0gfSBmcm9tICcuL3N0b3JhZ2UnO1xyXG5pbXBvcnQgeyBBcHBMb2dTdG9yYWdlLCBBcHBNZXRhZGF0YVN0b3JhZ2UgfSBmcm9tICcuL3N0b3JhZ2UnO1xyXG5pbXBvcnQgeyBBcHBTb3VyY2VTdG9yYWdlIH0gZnJvbSAnLi9zdG9yYWdlL0FwcFNvdXJjZVN0b3JhZ2UnO1xyXG5pbXBvcnQgeyBBcHBJbnN0YWxsYXRpb25Tb3VyY2UgfSBmcm9tICcuL3N0b3JhZ2UvSUFwcFN0b3JhZ2VJdGVtJztcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSUFwcEluc3RhbGxQYXJhbWV0ZXJzIHtcclxuXHRlbmFibGU6IGJvb2xlYW47XHJcblx0bWFya2V0cGxhY2VJbmZvPzogSU1hcmtldHBsYWNlSW5mb1tdO1xyXG5cdHBlcm1pc3Npb25zR3JhbnRlZD86IEFycmF5PElQZXJtaXNzaW9uPjtcclxuXHR1c2VyOiBJVXNlcjtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJQXBwVW5pbnN0YWxsUGFyYW1ldGVycyB7XHJcblx0dXNlcjogSVVzZXI7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSUFwcE1hbmFnZXJEZXBzIHtcclxuXHRtZXRhZGF0YVN0b3JhZ2U6IEFwcE1ldGFkYXRhU3RvcmFnZTtcclxuXHRsb2dTdG9yYWdlOiBBcHBMb2dTdG9yYWdlO1xyXG5cdGJyaWRnZXM6IEFwcEJyaWRnZXM7XHJcblx0c291cmNlU3RvcmFnZTogQXBwU291cmNlU3RvcmFnZTtcclxufVxyXG5cclxuaW50ZXJmYWNlIElQdXJnZUFwcENvbmZpZ09wdHMge1xyXG5cdGtlZXBTY2hlZHVsZWRKb2JzPzogYm9vbGVhbjtcclxuXHRrZWVwU2xhc2hjb21tYW5kcz86IGJvb2xlYW47XHJcblx0a2VlcE91dGJvdW5kQ29tbXVuaWNhdGlvblByb3ZpZGVycz86IGJvb2xlYW47XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBBcHBNYW5hZ2VyIHtcclxuXHRwdWJsaWMgc3RhdGljIEluc3RhbmNlOiBBcHBNYW5hZ2VyO1xyXG5cclxuXHQvLyBhcHBzIGNvbnRhaW5zIGFsbCBvZiB0aGUgQXBwc1xyXG5cdHByaXZhdGUgcmVhZG9ubHkgYXBwczogTWFwPHN0cmluZywgUHJveGllZEFwcD47XHJcblxyXG5cdHByaXZhdGUgcmVhZG9ubHkgYXBwTWV0YWRhdGFTdG9yYWdlOiBBcHBNZXRhZGF0YVN0b3JhZ2U7XHJcblxyXG5cdHByaXZhdGUgYXBwU291cmNlU3RvcmFnZTogQXBwU291cmNlU3RvcmFnZTtcclxuXHJcblx0cHJpdmF0ZSByZWFkb25seSBsb2dTdG9yYWdlOiBBcHBMb2dTdG9yYWdlO1xyXG5cclxuXHRwcml2YXRlIHJlYWRvbmx5IGJyaWRnZXM6IEFwcEJyaWRnZXM7XHJcblxyXG5cdHByaXZhdGUgcmVhZG9ubHkgcGFyc2VyOiBBcHBQYWNrYWdlUGFyc2VyO1xyXG5cclxuXHRwcml2YXRlIHJlYWRvbmx5IGNvbXBpbGVyOiBBcHBDb21waWxlcjtcclxuXHJcblx0cHJpdmF0ZSByZWFkb25seSBhY2Nlc3Nvck1hbmFnZXI6IEFwcEFjY2Vzc29yTWFuYWdlcjtcclxuXHJcblx0cHJpdmF0ZSByZWFkb25seSBsaXN0ZW5lck1hbmFnZXI6IEFwcExpc3RlbmVyTWFuYWdlcjtcclxuXHJcblx0cHJpdmF0ZSByZWFkb25seSBjb21tYW5kTWFuYWdlcjogQXBwU2xhc2hDb21tYW5kTWFuYWdlcjtcclxuXHJcblx0cHJpdmF0ZSByZWFkb25seSBhcGlNYW5hZ2VyOiBBcHBBcGlNYW5hZ2VyO1xyXG5cclxuXHRwcml2YXRlIHJlYWRvbmx5IGV4dGVybmFsQ29tcG9uZW50TWFuYWdlcjogQXBwRXh0ZXJuYWxDb21wb25lbnRNYW5hZ2VyO1xyXG5cclxuXHRwcml2YXRlIHJlYWRvbmx5IHNldHRpbmdzTWFuYWdlcjogQXBwU2V0dGluZ3NNYW5hZ2VyO1xyXG5cclxuXHRwcml2YXRlIHJlYWRvbmx5IGxpY2Vuc2VNYW5hZ2VyOiBBcHBMaWNlbnNlTWFuYWdlcjtcclxuXHJcblx0cHJpdmF0ZSByZWFkb25seSBzY2hlZHVsZXJNYW5hZ2VyOiBBcHBTY2hlZHVsZXJNYW5hZ2VyO1xyXG5cclxuXHRwcml2YXRlIHJlYWRvbmx5IHVpQWN0aW9uQnV0dG9uTWFuYWdlcjogVUlBY3Rpb25CdXR0b25NYW5hZ2VyO1xyXG5cclxuXHRwcml2YXRlIHJlYWRvbmx5IHZpZGVvQ29uZlByb3ZpZGVyTWFuYWdlcjogQXBwVmlkZW9Db25mUHJvdmlkZXJNYW5hZ2VyO1xyXG5cclxuXHRwcml2YXRlIHJlYWRvbmx5IG91dGJvdW5kQ29tbXVuaWNhdGlvblByb3ZpZGVyTWFuYWdlcjogQXBwT3V0Ym91bmRDb21tdW5pY2F0aW9uUHJvdmlkZXJNYW5hZ2VyO1xyXG5cclxuXHRwcml2YXRlIHJlYWRvbmx5IHNpZ25hdHVyZU1hbmFnZXI6IEFwcFNpZ25hdHVyZU1hbmFnZXI7XHJcblxyXG5cdHByaXZhdGUgcmVhZG9ubHkgcnVudGltZTogQXBwUnVudGltZU1hbmFnZXI7XHJcblxyXG5cdHByaXZhdGUgaXNMb2FkZWQ6IGJvb2xlYW47XHJcblxyXG5cdGNvbnN0cnVjdG9yKHsgbWV0YWRhdGFTdG9yYWdlLCBsb2dTdG9yYWdlLCBicmlkZ2VzLCBzb3VyY2VTdG9yYWdlIH06IElBcHBNYW5hZ2VyRGVwcykge1xyXG5cdFx0Ly8gU2luZ2xldG9uIHN0eWxlLiBUaGVyZSBjYW4gb25seSBldmVyIGJlIG9uZSBBcHBNYW5hZ2VyIGluc3RhbmNlXHJcblx0XHRpZiAodHlwZW9mIEFwcE1hbmFnZXIuSW5zdGFuY2UgIT09ICd1bmRlZmluZWQnKSB7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcignVGhlcmUgaXMgYWxyZWFkeSBhIHZhbGlkIEFwcE1hbmFnZXIgaW5zdGFuY2UnKTtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAobWV0YWRhdGFTdG9yYWdlIGluc3RhbmNlb2YgQXBwTWV0YWRhdGFTdG9yYWdlKSB7XHJcblx0XHRcdHRoaXMuYXBwTWV0YWRhdGFTdG9yYWdlID0gbWV0YWRhdGFTdG9yYWdlO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGluc3RhbmNlIG9mIHRoZSBBcHBNZXRhZGF0YVN0b3JhZ2UnKTtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAobG9nU3RvcmFnZSBpbnN0YW5jZW9mIEFwcExvZ1N0b3JhZ2UpIHtcclxuXHRcdFx0dGhpcy5sb2dTdG9yYWdlID0gbG9nU3RvcmFnZTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBpbnN0YW5jZSBvZiB0aGUgQXBwTG9nU3RvcmFnZScpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChicmlkZ2VzIGluc3RhbmNlb2YgQXBwQnJpZGdlcykge1xyXG5cdFx0XHR0aGlzLmJyaWRnZXMgPSBicmlkZ2VzO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGluc3RhbmNlIG9mIHRoZSBBcHBCcmlkZ2VzJyk7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKHNvdXJjZVN0b3JhZ2UgaW5zdGFuY2VvZiBBcHBTb3VyY2VTdG9yYWdlKSB7XHJcblx0XHRcdHRoaXMuYXBwU291cmNlU3RvcmFnZSA9IHNvdXJjZVN0b3JhZ2U7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgaW5zdGFuY2Ugb2YgdGhlIEFwcFNvdXJjZVN0b3JhZ2UnKTtcclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLmFwcHMgPSBuZXcgTWFwPHN0cmluZywgUHJveGllZEFwcD4oKTtcclxuXHJcblx0XHR0aGlzLnBhcnNlciA9IG5ldyBBcHBQYWNrYWdlUGFyc2VyKCk7XHJcblx0XHR0aGlzLmNvbXBpbGVyID0gbmV3IEFwcENvbXBpbGVyKCk7XHJcblx0XHR0aGlzLmFjY2Vzc29yTWFuYWdlciA9IG5ldyBBcHBBY2Nlc3Nvck1hbmFnZXIodGhpcyk7XHJcblx0XHR0aGlzLmxpc3RlbmVyTWFuYWdlciA9IG5ldyBBcHBMaXN0ZW5lck1hbmFnZXIodGhpcyk7XHJcblx0XHR0aGlzLmNvbW1hbmRNYW5hZ2VyID0gbmV3IEFwcFNsYXNoQ29tbWFuZE1hbmFnZXIodGhpcyk7XHJcblx0XHR0aGlzLmFwaU1hbmFnZXIgPSBuZXcgQXBwQXBpTWFuYWdlcih0aGlzKTtcclxuXHRcdHRoaXMuZXh0ZXJuYWxDb21wb25lbnRNYW5hZ2VyID0gbmV3IEFwcEV4dGVybmFsQ29tcG9uZW50TWFuYWdlcigpO1xyXG5cdFx0dGhpcy5zZXR0aW5nc01hbmFnZXIgPSBuZXcgQXBwU2V0dGluZ3NNYW5hZ2VyKHRoaXMpO1xyXG5cdFx0dGhpcy5saWNlbnNlTWFuYWdlciA9IG5ldyBBcHBMaWNlbnNlTWFuYWdlcih0aGlzKTtcclxuXHRcdHRoaXMuc2NoZWR1bGVyTWFuYWdlciA9IG5ldyBBcHBTY2hlZHVsZXJNYW5hZ2VyKHRoaXMpO1xyXG5cdFx0dGhpcy51aUFjdGlvbkJ1dHRvbk1hbmFnZXIgPSBuZXcgVUlBY3Rpb25CdXR0b25NYW5hZ2VyKHRoaXMpO1xyXG5cdFx0dGhpcy52aWRlb0NvbmZQcm92aWRlck1hbmFnZXIgPSBuZXcgQXBwVmlkZW9Db25mUHJvdmlkZXJNYW5hZ2VyKHRoaXMpO1xyXG5cdFx0dGhpcy5vdXRib3VuZENvbW11bmljYXRpb25Qcm92aWRlck1hbmFnZXIgPSBuZXcgQXBwT3V0Ym91bmRDb21tdW5pY2F0aW9uUHJvdmlkZXJNYW5hZ2VyKHRoaXMpO1xyXG5cdFx0dGhpcy5zaWduYXR1cmVNYW5hZ2VyID0gbmV3IEFwcFNpZ25hdHVyZU1hbmFnZXIodGhpcyk7XHJcblx0XHR0aGlzLnJ1bnRpbWUgPSBuZXcgQXBwUnVudGltZU1hbmFnZXIodGhpcyk7XHJcblxyXG5cdFx0dGhpcy5pc0xvYWRlZCA9IGZhbHNlO1xyXG5cdFx0QXBwTWFuYWdlci5JbnN0YW5jZSA9IHRoaXM7XHJcblx0fVxyXG5cclxuXHQvKiogR2V0cyB0aGUgaW5zdGFuY2Ugb2YgdGhlIHN0b3JhZ2UgY29ubmVjdG9yLiAqL1xyXG5cdHB1YmxpYyBnZXRTdG9yYWdlKCk6IEFwcE1ldGFkYXRhU3RvcmFnZSB7XHJcblx0XHRyZXR1cm4gdGhpcy5hcHBNZXRhZGF0YVN0b3JhZ2U7XHJcblx0fVxyXG5cclxuXHQvKiogR2V0cyB0aGUgaW5zdGFuY2Ugb2YgdGhlIGxvZyBzdG9yYWdlIGNvbm5lY3Rvci4gKi9cclxuXHRwdWJsaWMgZ2V0TG9nU3RvcmFnZSgpOiBBcHBMb2dTdG9yYWdlIHtcclxuXHRcdHJldHVybiB0aGlzLmxvZ1N0b3JhZ2U7XHJcblx0fVxyXG5cclxuXHQvKiogR2V0cyB0aGUgaW5zdGFuY2Ugb2YgdGhlIEFwcCBwYWNrYWdlIHBhcnNlci4gKi9cclxuXHRwdWJsaWMgZ2V0UGFyc2VyKCk6IEFwcFBhY2thZ2VQYXJzZXIge1xyXG5cdFx0cmV0dXJuIHRoaXMucGFyc2VyO1xyXG5cdH1cclxuXHJcblx0LyoqIEdldHMgdGhlIGNvbXBpbGVyIGluc3RhbmNlLiAqL1xyXG5cdHB1YmxpYyBnZXRDb21waWxlcigpOiBBcHBDb21waWxlciB7XHJcblx0XHRyZXR1cm4gdGhpcy5jb21waWxlcjtcclxuXHR9XHJcblxyXG5cdC8qKiBHZXRzIHRoZSBhY2Nlc3NvciBtYW5hZ2VyIGluc3RhbmNlLiAqL1xyXG5cdHB1YmxpYyBnZXRBY2Nlc3Nvck1hbmFnZXIoKTogQXBwQWNjZXNzb3JNYW5hZ2VyIHtcclxuXHRcdHJldHVybiB0aGlzLmFjY2Vzc29yTWFuYWdlcjtcclxuXHR9XHJcblxyXG5cdC8qKiBHZXRzIHRoZSBpbnN0YW5jZSBvZiB0aGUgQnJpZGdlIG1hbmFnZXIuICovXHJcblx0cHVibGljIGdldEJyaWRnZXMoKTogQXBwQnJpZGdlcyB7XHJcblx0XHRyZXR1cm4gdGhpcy5icmlkZ2VzO1xyXG5cdH1cclxuXHJcblx0LyoqIEdldHMgdGhlIGluc3RhbmNlIG9mIHRoZSBsaXN0ZW5lciBtYW5hZ2VyLiAqL1xyXG5cdHB1YmxpYyBnZXRMaXN0ZW5lck1hbmFnZXIoKTogQXBwTGlzdGVuZXJNYW5hZ2VyIHtcclxuXHRcdHJldHVybiB0aGlzLmxpc3RlbmVyTWFuYWdlcjtcclxuXHR9XHJcblxyXG5cdC8qKiBHZXRzIHRoZSBjb21tYW5kIG1hbmFnZXIncyBpbnN0YW5jZS4gKi9cclxuXHRwdWJsaWMgZ2V0Q29tbWFuZE1hbmFnZXIoKTogQXBwU2xhc2hDb21tYW5kTWFuYWdlciB7XHJcblx0XHRyZXR1cm4gdGhpcy5jb21tYW5kTWFuYWdlcjtcclxuXHR9XHJcblxyXG5cdHB1YmxpYyBnZXRWaWRlb0NvbmZQcm92aWRlck1hbmFnZXIoKTogQXBwVmlkZW9Db25mUHJvdmlkZXJNYW5hZ2VyIHtcclxuXHRcdHJldHVybiB0aGlzLnZpZGVvQ29uZlByb3ZpZGVyTWFuYWdlcjtcclxuXHR9XHJcblxyXG5cdHB1YmxpYyBnZXRPdXRib3VuZENvbW11bmljYXRpb25Qcm92aWRlck1hbmFnZXIoKTogQXBwT3V0Ym91bmRDb21tdW5pY2F0aW9uUHJvdmlkZXJNYW5hZ2VyIHtcclxuXHRcdHJldHVybiB0aGlzLm91dGJvdW5kQ29tbXVuaWNhdGlvblByb3ZpZGVyTWFuYWdlcjtcclxuXHR9XHJcblxyXG5cdHB1YmxpYyBnZXRMaWNlbnNlTWFuYWdlcigpOiBBcHBMaWNlbnNlTWFuYWdlciB7XHJcblx0XHRyZXR1cm4gdGhpcy5saWNlbnNlTWFuYWdlcjtcclxuXHR9XHJcblxyXG5cdC8qKiBHZXRzIHRoZSBhcGkgbWFuYWdlcidzIGluc3RhbmNlLiAqL1xyXG5cdHB1YmxpYyBnZXRBcGlNYW5hZ2VyKCk6IEFwcEFwaU1hbmFnZXIge1xyXG5cdFx0cmV0dXJuIHRoaXMuYXBpTWFuYWdlcjtcclxuXHR9XHJcblxyXG5cdC8qKiBHZXRzIHRoZSBleHRlcm5hbCBjb21wb25lbnQgbWFuYWdlcidzIGluc3RhbmNlLiAqL1xyXG5cdHB1YmxpYyBnZXRFeHRlcm5hbENvbXBvbmVudE1hbmFnZXIoKTogQXBwRXh0ZXJuYWxDb21wb25lbnRNYW5hZ2VyIHtcclxuXHRcdHJldHVybiB0aGlzLmV4dGVybmFsQ29tcG9uZW50TWFuYWdlcjtcclxuXHR9XHJcblxyXG5cdC8qKiBHZXRzIHRoZSBtYW5hZ2VyIG9mIHRoZSBzZXR0aW5ncywgdXBkYXRlcyBhbmQgZ2V0dGluZy4gKi9cclxuXHRwdWJsaWMgZ2V0U2V0dGluZ3NNYW5hZ2VyKCk6IEFwcFNldHRpbmdzTWFuYWdlciB7XHJcblx0XHRyZXR1cm4gdGhpcy5zZXR0aW5nc01hbmFnZXI7XHJcblx0fVxyXG5cclxuXHRwdWJsaWMgZ2V0U2NoZWR1bGVyTWFuYWdlcigpOiBBcHBTY2hlZHVsZXJNYW5hZ2VyIHtcclxuXHRcdHJldHVybiB0aGlzLnNjaGVkdWxlck1hbmFnZXI7XHJcblx0fVxyXG5cclxuXHRwdWJsaWMgZ2V0VUlBY3Rpb25CdXR0b25NYW5hZ2VyKCk6IFVJQWN0aW9uQnV0dG9uTWFuYWdlciB7XHJcblx0XHRyZXR1cm4gdGhpcy51aUFjdGlvbkJ1dHRvbk1hbmFnZXI7XHJcblx0fVxyXG5cclxuXHRwdWJsaWMgZ2V0U2lnbmF0dXJlTWFuYWdlcigpOiBBcHBTaWduYXR1cmVNYW5hZ2VyIHtcclxuXHRcdHJldHVybiB0aGlzLnNpZ25hdHVyZU1hbmFnZXI7XHJcblx0fVxyXG5cclxuXHRwdWJsaWMgZ2V0UnVudGltZSgpOiBBcHBSdW50aW1lTWFuYWdlciB7XHJcblx0XHRyZXR1cm4gdGhpcy5ydW50aW1lO1xyXG5cdH1cclxuXHJcblx0LyoqIEdldHMgd2hldGhlciB0aGUgQXBwcyBoYXZlIGJlZW4gbG9hZGVkIG9yIG5vdC4gKi9cclxuXHRwdWJsaWMgYXJlQXBwc0xvYWRlZCgpOiBib29sZWFuIHtcclxuXHRcdHJldHVybiB0aGlzLmlzTG9hZGVkO1xyXG5cdH1cclxuXHJcblx0cHVibGljIHNldFNvdXJjZVN0b3JhZ2Uoc3RvcmFnZTogQXBwU291cmNlU3RvcmFnZSk6IHZvaWQge1xyXG5cdFx0dGhpcy5hcHBTb3VyY2VTdG9yYWdlID0gc3RvcmFnZTtcclxuXHR9XHJcblxyXG5cdC8qKlxyXG5cdCAqIEdvZXMgdGhyb3VnaCB0aGUgZW50aXJlIGxvYWRpbmcgdXAgcHJvY2Vzcy5cclxuXHQgKiBFeHBlY3QgdGhpcyB0byB0YWtlIHNvbWUgdGltZSwgYXMgaXQgZ29lcyB0aHJvdWdoIGEgdmVyeVxyXG5cdCAqIGxvbmcgcHJvY2VzcyBvZiBsb2FkaW5nIGFsbCB0aGUgQXBwcyB1cC5cclxuXHQgKi9cclxuXHRwdWJsaWMgYXN5bmMgbG9hZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcclxuXHRcdC8vIFlvdSBjYW4gbm90IGxvYWQgdGhlIEFwcE1hbmFnZXIgc3lzdGVtIGFnYWluXHJcblx0XHQvLyBpZiBpdCBoYXMgYWxyZWFkeSBiZWVuIGxvYWRlZC5cclxuXHRcdGlmICh0aGlzLmlzTG9hZGVkKSB7XHJcblx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0fVxyXG5cclxuXHRcdGNvbnN0IGl0ZW1zOiBNYXA8c3RyaW5nLCBJQXBwU3RvcmFnZUl0ZW0+ID0gYXdhaXQgdGhpcy5hcHBNZXRhZGF0YVN0b3JhZ2UucmV0cmlldmVBbGwoKTtcclxuXHJcblx0XHRmb3IgKGNvbnN0IGl0ZW0gb2YgaXRlbXMudmFsdWVzKCkpIHtcclxuXHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRjb25zdCBhcHBQYWNrYWdlID0gYXdhaXQgdGhpcy5hcHBTb3VyY2VTdG9yYWdlLmZldGNoKGl0ZW0pO1xyXG5cdFx0XHRcdGNvbnN0IHVucGFja2FnZVJlc3VsdCA9IGF3YWl0IHRoaXMuZ2V0UGFyc2VyKCkudW5wYWNrYWdlQXBwKGFwcFBhY2thZ2UpO1xyXG5cclxuXHRcdFx0XHRjb25zdCBhcHAgPSBhd2FpdCB0aGlzLmdldENvbXBpbGVyKCkudG9TYW5kQm94KHRoaXMsIGl0ZW0sIHVucGFja2FnZVJlc3VsdCk7XHJcblxyXG5cdFx0XHRcdHRoaXMuYXBwcy5zZXQoaXRlbS5pZCwgYXBwKTtcclxuXHRcdFx0fSBjYXRjaCAoZSkge1xyXG5cdFx0XHRcdGNvbnNvbGUud2FybihgRXJyb3Igd2hpbGUgY29tcGlsaW5nIHRoZSBBcHAgXCIke2l0ZW0uaW5mby5uYW1lfSAoJHtpdGVtLmlkfSlcIjpgKTtcclxuXHRcdFx0XHRjb25zb2xlLmVycm9yKGUpO1xyXG5cclxuXHRcdFx0XHRjb25zdCBwcmwgPSBuZXcgUHJveGllZEFwcCh0aGlzLCBpdGVtLCBuZXcgRW1wdHlSdW50aW1lKGl0ZW0uaWQpKTtcclxuXHJcblx0XHRcdFx0dGhpcy5hcHBzLnNldChpdGVtLmlkLCBwcmwpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5pc0xvYWRlZCA9IHRydWU7XHJcblx0XHRyZXR1cm4gdHJ1ZTtcclxuXHR9XHJcblxyXG5cdHB1YmxpYyBhc3luYyBlbmFibGVBbGwoKTogUHJvbWlzZTxBcnJheTxBcHBGYWJyaWNhdGlvbkZ1bGZpbGxtZW50Pj4ge1xyXG5cdFx0Y29uc3QgYWZmczogQXJyYXk8QXBwRmFicmljYXRpb25GdWxmaWxsbWVudD4gPSBbXTtcclxuXHJcblx0XHQvLyBMZXQncyBpbml0aWFsaXplIHRoZW1cclxuXHRcdGZvciAoY29uc3Qgcmwgb2YgdGhpcy5hcHBzLnZhbHVlcygpKSB7XHJcblx0XHRcdGNvbnN0IGFmZiA9IG5ldyBBcHBGYWJyaWNhdGlvbkZ1bGZpbGxtZW50KCk7XHJcblxyXG5cdFx0XHRhZmYuc2V0QXBwSW5mbyhybC5nZXRJbmZvKCkpO1xyXG5cdFx0XHRhZmYuc2V0SW1wbGVtZW50ZWRJbnRlcmZhY2VzKHJsLmdldEltcGxlbWVudGF0aW9uTGlzdCgpKTtcclxuXHRcdFx0YWZmLnNldEFwcChybCk7XHJcblx0XHRcdGFmZnMucHVzaChhZmYpO1xyXG5cclxuXHRcdFx0aWYgKEFwcFN0YXR1c1V0aWxzLmlzRGlzYWJsZWQoYXdhaXQgcmwuZ2V0U3RhdHVzKCkpKSB7XHJcblx0XHRcdFx0Ly8gVXN1YWxseSBpZiBhbiBBcHAgaXMgZGlzYWJsZWQgYmVmb3JlIGl0J3MgaW5pdGlhbGl6ZWQsXHJcblx0XHRcdFx0Ly8gdGhlbiBzb21ldGhpbmcgKHN1Y2ggYXMgYW4gZXJyb3IpIG9jY3VyZWQgd2hpbGVcclxuXHRcdFx0XHQvLyBpdCB3YXMgY29tcGlsZWQgb3Igc29tZXRoaW5nIHNpbWlsYXIuXHJcblx0XHRcdFx0Ly8gV2Ugc3RpbGwgaGF2ZSB0byB2YWxpZGF0ZSBpdHMgbGljZW5zZSwgdGhvdWdoXHJcblx0XHRcdFx0YXdhaXQgcmwudmFsaWRhdGVMaWNlbnNlKCk7XHJcblxyXG5cdFx0XHRcdGNvbnRpbnVlO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRhd2FpdCB0aGlzLmluaXRpYWxpemVBcHAocmwsIHRydWUpLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vIExldCdzIGVuc3VyZSB0aGUgcmVxdWlyZWQgc2V0dGluZ3MgYXJlIGFsbCBzZXRcclxuXHRcdGZvciAoY29uc3Qgcmwgb2YgdGhpcy5hcHBzLnZhbHVlcygpKSB7XHJcblx0XHRcdGlmIChBcHBTdGF0dXNVdGlscy5pc0Rpc2FibGVkKGF3YWl0IHJsLmdldFN0YXR1cygpKSkge1xyXG5cdFx0XHRcdGNvbnRpbnVlO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiAoIXRoaXMuYXJlUmVxdWlyZWRTZXR0aW5nc1NldChybC5nZXRTdG9yYWdlSXRlbSgpKSkge1xyXG5cdFx0XHRcdGF3YWl0IHJsLnNldFN0YXR1cyhBcHBTdGF0dXMuSU5WQUxJRF9TRVRUSU5HU19ESVNBQkxFRCkuY2F0Y2goY29uc29sZS5lcnJvcik7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHQvLyBOb3cgbGV0J3MgZW5hYmxlIHRoZSBhcHBzIHdoaWNoIHdlcmUgb25jZSBlbmFibGVkXHJcblx0XHQvLyBidXQgYXJlIG5vdCBjdXJyZW50bHkgZGlzYWJsZWQuXHJcblx0XHRmb3IgKGNvbnN0IGFwcCBvZiB0aGlzLmFwcHMudmFsdWVzKCkpIHtcclxuXHRcdFx0Y29uc3Qgc3RhdHVzID0gYXdhaXQgYXBwLmdldFN0YXR1cygpO1xyXG5cdFx0XHRpZiAoIUFwcFN0YXR1c1V0aWxzLmlzRGlzYWJsZWQoc3RhdHVzKSAmJiBBcHBTdGF0dXNVdGlscy5pc0VuYWJsZWQoYXBwLmdldFByZXZpb3VzU3RhdHVzKCkpKSB7XHJcblx0XHRcdFx0YXdhaXQgdGhpcy5lbmFibGVBcHAoYXBwKS5jYXRjaChjb25zb2xlLmVycm9yKTtcclxuXHRcdFx0fSBlbHNlIGlmICghQXBwU3RhdHVzVXRpbHMuaXNFcnJvcihzdGF0dXMpKSB7XHJcblx0XHRcdFx0dGhpcy5saXN0ZW5lck1hbmFnZXIubG9ja0Vzc2VudGlhbEV2ZW50cyhhcHApO1xyXG5cdFx0XHRcdHRoaXMudWlBY3Rpb25CdXR0b25NYW5hZ2VyLmNsZWFyQXBwQWN0aW9uQnV0dG9ucyhhcHAuZ2V0SUQoKSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gYWZmcztcclxuXHR9XHJcblxyXG5cdHB1YmxpYyBhc3luYyB1bmxvYWQoaXNNYW51YWw6IGJvb2xlYW4pOiBQcm9taXNlPHZvaWQ+IHtcclxuXHRcdC8vIElmIHRoZSBBcHBNYW5hZ2VyIGhhc24ndCBiZWVuIGxvYWRlZCB5ZXQsIHRoZW5cclxuXHRcdC8vIHRoZXJlIGlzIG5vdGhpbmcgdG8gdW5sb2FkXHJcblx0XHRpZiAoIXRoaXMuaXNMb2FkZWQpIHtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cclxuXHRcdGZvciAoY29uc3QgYXBwIG9mIHRoaXMuYXBwcy52YWx1ZXMoKSkge1xyXG5cdFx0XHRjb25zdCBzdGF0dXMgPSBhd2FpdCBhcHAuZ2V0U3RhdHVzKCk7XHJcblx0XHRcdGlmIChzdGF0dXMgPT09IEFwcFN0YXR1cy5JTklUSUFMSVpFRCkge1xyXG5cdFx0XHRcdGF3YWl0IHRoaXMucHVyZ2VBcHBDb25maWcoYXBwKTtcclxuXHRcdFx0fSBlbHNlIGlmICghQXBwU3RhdHVzVXRpbHMuaXNEaXNhYmxlZChzdGF0dXMpKSB7XHJcblx0XHRcdFx0YXdhaXQgdGhpcy5kaXNhYmxlKGFwcC5nZXRJRCgpLCBpc01hbnVhbCA/IEFwcFN0YXR1cy5NQU5VQUxMWV9ESVNBQkxFRCA6IEFwcFN0YXR1cy5ESVNBQkxFRCk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHRoaXMubGlzdGVuZXJNYW5hZ2VyLnJlbGVhc2VFc3NlbnRpYWxFdmVudHMoYXBwKTtcclxuXHJcblx0XHRcdGFwcC5nZXRSdW50aW1lQ29udHJvbGxlcigpLnN0b3BBcHAoKTtcclxuXHRcdH1cclxuXHJcblx0XHQvLyBSZW1vdmUgYWxsIHRoZSBhcHBzIGZyb20gdGhlIHN5c3RlbSBub3cgdGhhdCB3ZSBoYXZlIHVubG9hZGVkIGV2ZXJ5dGhpbmdcclxuXHRcdHRoaXMuYXBwcy5jbGVhcigpO1xyXG5cclxuXHRcdHRoaXMuaXNMb2FkZWQgPSBmYWxzZTtcclxuXHR9XHJcblxyXG5cdC8qKiBHZXRzIHRoZSBBcHBzIHdoaWNoIG1hdGNoIHRoZSBmaWx0ZXIgcGFzc2VkIGluLiAqL1xyXG5cdHB1YmxpYyBhc3luYyBnZXQoZmlsdGVyPzogSUdldEFwcHNGaWx0ZXIpOiBQcm9taXNlPFByb3hpZWRBcHBbXT4ge1xyXG5cdFx0bGV0IHJsczogQXJyYXk8UHJveGllZEFwcD4gPSBbXTtcclxuXHJcblx0XHRpZiAodHlwZW9mIGZpbHRlciA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuXHRcdFx0dGhpcy5hcHBzLmZvckVhY2goKHJsKSA9PiBybHMucHVzaChybCkpO1xyXG5cclxuXHRcdFx0cmV0dXJuIHJscztcclxuXHRcdH1cclxuXHJcblx0XHRsZXQgbm90aGluZyA9IHRydWU7XHJcblxyXG5cdFx0aWYgKHR5cGVvZiBmaWx0ZXIuZW5hYmxlZCA9PT0gJ2Jvb2xlYW4nICYmIGZpbHRlci5lbmFibGVkKSB7XHJcblx0XHRcdGZvciAoY29uc3Qgcmwgb2YgdGhpcy5hcHBzLnZhbHVlcygpKSB7XHJcblx0XHRcdFx0aWYgKEFwcFN0YXR1c1V0aWxzLmlzRW5hYmxlZChhd2FpdCBybC5nZXRTdGF0dXMoKSkpIHtcclxuXHRcdFx0XHRcdHJscy5wdXNoKHJsKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdG5vdGhpbmcgPSBmYWxzZTtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAodHlwZW9mIGZpbHRlci5kaXNhYmxlZCA9PT0gJ2Jvb2xlYW4nICYmIGZpbHRlci5kaXNhYmxlZCkge1xyXG5cdFx0XHRmb3IgKGNvbnN0IHJsIG9mIHRoaXMuYXBwcy52YWx1ZXMoKSkge1xyXG5cdFx0XHRcdGlmIChBcHBTdGF0dXNVdGlscy5pc0Rpc2FibGVkKGF3YWl0IHJsLmdldFN0YXR1cygpKSkge1xyXG5cdFx0XHRcdFx0cmxzLnB1c2gocmwpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0bm90aGluZyA9IGZhbHNlO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChub3RoaW5nKSB7XHJcblx0XHRcdHRoaXMuYXBwcy5mb3JFYWNoKChybCkgPT4gcmxzLnB1c2gocmwpKTtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAodHlwZW9mIGZpbHRlci5pZHMgIT09ICd1bmRlZmluZWQnKSB7XHJcblx0XHRcdHJscyA9IHJscy5maWx0ZXIoKHJsKSA9PiBmaWx0ZXIuaWRzLmluY2x1ZGVzKHJsLmdldElEKCkpKTtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAodHlwZW9mIGZpbHRlci5pbnN0YWxsYXRpb25Tb3VyY2UgIT09ICd1bmRlZmluZWQnKSB7XHJcblx0XHRcdHJscyA9IHJscy5maWx0ZXIoKHJsKSA9PiBybC5nZXRJbnN0YWxsYXRpb25Tb3VyY2UoKSA9PT0gZmlsdGVyLmluc3RhbGxhdGlvblNvdXJjZSk7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKHR5cGVvZiBmaWx0ZXIubmFtZSA9PT0gJ3N0cmluZycpIHtcclxuXHRcdFx0cmxzID0gcmxzLmZpbHRlcigocmwpID0+IHJsLmdldE5hbWUoKSA9PT0gZmlsdGVyLm5hbWUpO1xyXG5cdFx0fSBlbHNlIGlmIChmaWx0ZXIubmFtZSBpbnN0YW5jZW9mIFJlZ0V4cCkge1xyXG5cdFx0XHRybHMgPSBybHMuZmlsdGVyKChybCkgPT4gKGZpbHRlci5uYW1lIGFzIFJlZ0V4cCkudGVzdChybC5nZXROYW1lKCkpKTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gcmxzO1xyXG5cdH1cclxuXHJcblx0LyoqIEdldHMgYSBzaW5nbGUgQXBwIGJ5IHRoZSBpZCBwYXNzZWQgaW4uICovXHJcblx0cHVibGljIGdldE9uZUJ5SWQoYXBwSWQ6IHN0cmluZyk6IFByb3hpZWRBcHAge1xyXG5cdFx0cmV0dXJuIHRoaXMuYXBwcy5nZXQoYXBwSWQpO1xyXG5cdH1cclxuXHJcblx0cHVibGljIGdldFBlcm1pc3Npb25zQnlJZChhcHBJZDogc3RyaW5nKTogQXJyYXk8SVBlcm1pc3Npb24+IHtcclxuXHRcdGNvbnN0IGFwcCA9IHRoaXMuYXBwcy5nZXQoYXBwSWQpO1xyXG5cclxuXHRcdGlmICghYXBwKSB7XHJcblx0XHRcdHJldHVybiBbXTtcclxuXHRcdH1cclxuXHRcdGNvbnN0IHsgcGVybWlzc2lvbnNHcmFudGVkIH0gPSBhcHAuZ2V0U3RvcmFnZUl0ZW0oKTtcclxuXHJcblx0XHRyZXR1cm4gcGVybWlzc2lvbnNHcmFudGVkIHx8IGRlZmF1bHRQZXJtaXNzaW9ucztcclxuXHR9XHJcblxyXG5cdHB1YmxpYyBhc3luYyBlbmFibGUoaWQ6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xyXG5cdFx0Y29uc3QgcmwgPSB0aGlzLmFwcHMuZ2V0KGlkKTtcclxuXHJcblx0XHRpZiAoIXJsKSB7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcihgTm8gQXBwIGJ5IHRoZSBpZCBcIiR7aWR9XCIgZXhpc3RzLmApO1xyXG5cdFx0fVxyXG5cclxuXHRcdGNvbnN0IHN0YXR1cyA9IGF3YWl0IHJsLmdldFN0YXR1cygpO1xyXG5cclxuXHRcdGlmIChBcHBTdGF0dXNVdGlscy5pc0VuYWJsZWQoc3RhdHVzKSkge1xyXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoc3RhdHVzID09PSBBcHBTdGF0dXMuQ09NUElMRVJfRVJST1JfRElTQUJMRUQpIHtcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdUaGUgQXBwIGhhZCBjb21waWxlciBlcnJvcnMsIGNhbiBub3QgZW5hYmxlIGl0LicpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGNvbnN0IHN0b3JhZ2VJdGVtID0gYXdhaXQgdGhpcy5hcHBNZXRhZGF0YVN0b3JhZ2UucmV0cmlldmVPbmUoaWQpO1xyXG5cclxuXHRcdGlmICghc3RvcmFnZUl0ZW0pIHtcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBDb3VsZCBub3QgZW5hYmxlIGFuIEFwcCB3aXRoIHRoZSBpZCBvZiBcIiR7aWR9XCIgYXMgaXQgZG9lc24ndCBleGlzdC5gKTtcclxuXHRcdH1cclxuXHJcblx0XHRjb25zdCBpc1NldHVwID0gYXdhaXQgdGhpcy5ydW5TdGFydFVwUHJvY2VzcyhzdG9yYWdlSXRlbSwgcmwsIGZhbHNlKTtcclxuXHJcblx0XHRyZXR1cm4gaXNTZXR1cDtcclxuXHR9XHJcblxyXG5cdHB1YmxpYyBhc3luYyBkaXNhYmxlKGlkOiBzdHJpbmcsIHN0YXR1czogQXBwU3RhdHVzID0gQXBwU3RhdHVzLkRJU0FCTEVELCBzaWxlbnQ/OiBib29sZWFuKTogUHJvbWlzZTxib29sZWFuPiB7XHJcblx0XHRpZiAoIUFwcFN0YXR1c1V0aWxzLmlzRGlzYWJsZWQoc3RhdHVzKSkge1xyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgZGlzYWJsZWQgc3RhdHVzJyk7XHJcblx0XHR9XHJcblxyXG5cdFx0Y29uc3QgYXBwID0gdGhpcy5hcHBzLmdldChpZCk7XHJcblxyXG5cdFx0aWYgKCFhcHApIHtcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBObyBBcHAgYnkgdGhlIGlkIFwiJHtpZH1cIiBleGlzdHMuYCk7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKEFwcFN0YXR1c1V0aWxzLmlzRW5hYmxlZChhd2FpdCBhcHAuZ2V0U3RhdHVzKCkpKSB7XHJcblx0XHRcdGF3YWl0IGFwcC5jYWxsKEFwcE1ldGhvZC5PTkRJU0FCTEUpLmNhdGNoKChlKSA9PiBjb25zb2xlLndhcm4oJ0Vycm9yIHdoaWxlIGRpc2FibGluZzonLCBlKSk7XHJcblx0XHR9XHJcblxyXG5cdFx0YXdhaXQgdGhpcy5wdXJnZUFwcENvbmZpZyhhcHAsIHtcclxuXHRcdFx0a2VlcFNjaGVkdWxlZEpvYnM6IHRydWUsXHJcblx0XHRcdGtlZXBTbGFzaGNvbW1hbmRzOiB0cnVlLFxyXG5cdFx0XHRrZWVwT3V0Ym91bmRDb21tdW5pY2F0aW9uUHJvdmlkZXJzOiB0cnVlLFxyXG5cdFx0fSk7XHJcblxyXG5cdFx0YXdhaXQgYXBwLnNldFN0YXR1cyhzdGF0dXMsIHNpbGVudCk7XHJcblxyXG5cdFx0Y29uc3Qgc3RvcmFnZUl0ZW0gPSBhd2FpdCB0aGlzLmFwcE1ldGFkYXRhU3RvcmFnZS5yZXRyaWV2ZU9uZShpZCk7XHJcblxyXG5cdFx0YXBwLmdldFN0b3JhZ2VJdGVtKCkubWFya2V0cGxhY2VJbmZvID0gc3RvcmFnZUl0ZW0ubWFya2V0cGxhY2VJbmZvO1xyXG5cdFx0YXdhaXQgYXBwLnZhbGlkYXRlTGljZW5zZSgpLmNhdGNoKCgpID0+IHt9KTtcclxuXHJcblx0XHRyZXR1cm4gdHJ1ZTtcclxuXHR9XHJcblxyXG5cdHB1YmxpYyBhc3luYyBtaWdyYXRlKGlkOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcclxuXHRcdGNvbnN0IGFwcCA9IHRoaXMuYXBwcy5nZXQoaWQpO1xyXG5cclxuXHRcdGlmICghYXBwKSB7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcihgTm8gQXBwIGJ5IHRoZSBpZCBcIiR7aWR9XCIgZXhpc3RzLmApO1xyXG5cdFx0fVxyXG5cclxuXHRcdGF3YWl0IGFwcC5jYWxsKEFwcE1ldGhvZC5PTlVQREFURSkuY2F0Y2goKGUpID0+IGNvbnNvbGUud2FybignRXJyb3Igd2hpbGUgbWlncmF0aW5nOicsIGUpKTtcclxuXHJcblx0XHRhd2FpdCB0aGlzLnB1cmdlQXBwQ29uZmlnKGFwcCwgeyBrZWVwU2NoZWR1bGVkSm9iczogdHJ1ZSB9KTtcclxuXHJcblx0XHRjb25zdCBzdG9yYWdlSXRlbSA9IGF3YWl0IHRoaXMuYXBwTWV0YWRhdGFTdG9yYWdlLnJldHJpZXZlT25lKGlkKTtcclxuXHJcblx0XHRhcHAuZ2V0U3RvcmFnZUl0ZW0oKS5tYXJrZXRwbGFjZUluZm8gPSBzdG9yYWdlSXRlbS5tYXJrZXRwbGFjZUluZm87XHJcblx0XHRhd2FpdCBhcHAudmFsaWRhdGVMaWNlbnNlKCkuY2F0Y2goKCkgPT4ge30pO1xyXG5cclxuXHRcdHN0b3JhZ2VJdGVtLm1pZ3JhdGVkID0gdHJ1ZTtcclxuXHRcdHN0b3JhZ2VJdGVtLnNpZ25hdHVyZSA9IGF3YWl0IHRoaXMuZ2V0U2lnbmF0dXJlTWFuYWdlcigpLnNpZ25BcHAoc3RvcmFnZUl0ZW0pO1xyXG5cclxuXHRcdGNvbnN0IHsgbWFya2V0cGxhY2VJbmZvLCBzaWduYXR1cmUsIG1pZ3JhdGVkLCBfaWQgfSA9IHN0b3JhZ2VJdGVtO1xyXG5cdFx0Y29uc3Qgc3RvcmVkID0gYXdhaXQgdGhpcy5hcHBNZXRhZGF0YVN0b3JhZ2UudXBkYXRlUGFydGlhbEFuZFJldHVybkRvY3VtZW50KHsgbWFya2V0cGxhY2VJbmZvLCBzaWduYXR1cmUsIG1pZ3JhdGVkLCBfaWQgfSk7XHJcblxyXG5cdFx0YXdhaXQgdGhpcy51cGRhdGVMb2NhbChzdG9yZWQsIGFwcCk7XHJcblx0XHRhd2FpdCB0aGlzLmJyaWRnZXNcclxuXHRcdFx0LmdldEFwcEFjdGl2YXRpb25CcmlkZ2UoKVxyXG5cdFx0XHQuZG9BcHBVcGRhdGVkKGFwcClcclxuXHRcdFx0LmNhdGNoKCgpID0+IHt9KTtcclxuXHJcblx0XHRyZXR1cm4gdHJ1ZTtcclxuXHR9XHJcblxyXG5cdHB1YmxpYyBhc3luYyBhZGRMb2NhbChhcHBJZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XHJcblx0XHRjb25zdCBzdG9yYWdlSXRlbSA9IGF3YWl0IHRoaXMuYXBwTWV0YWRhdGFTdG9yYWdlLnJldHJpZXZlT25lKGFwcElkKTtcclxuXHJcblx0XHRpZiAoIXN0b3JhZ2VJdGVtKSB7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcihgQXBwIHdpdGggaWQgJHthcHBJZH0gY291bGRuJ3QgYmUgZm91bmRgKTtcclxuXHRcdH1cclxuXHJcblx0XHRjb25zdCBhcHBQYWNrYWdlID0gYXdhaXQgdGhpcy5hcHBTb3VyY2VTdG9yYWdlLmZldGNoKHN0b3JhZ2VJdGVtKTtcclxuXHJcblx0XHRpZiAoIWFwcFBhY2thZ2UpIHtcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBQYWNrYWdlIGZpbGUgZm9yIGFwcCBcIiR7c3RvcmFnZUl0ZW0uaW5mby5uYW1lfVwiICgke2FwcElkfSkgY291bGRuJ3QgYmUgZm91bmRgKTtcclxuXHRcdH1cclxuXHJcblx0XHRjb25zdCBwYXJzZWRQYWNrYWdlID0gYXdhaXQgdGhpcy5nZXRQYXJzZXIoKS51bnBhY2thZ2VBcHAoYXBwUGFja2FnZSk7XHJcblx0XHRjb25zdCBhcHAgPSBhd2FpdCB0aGlzLmdldENvbXBpbGVyKCkudG9TYW5kQm94KHRoaXMsIHN0b3JhZ2VJdGVtLCBwYXJzZWRQYWNrYWdlKTtcclxuXHJcblx0XHR0aGlzLmFwcHMuc2V0KGFwcC5nZXRJRCgpLCBhcHApO1xyXG5cclxuXHRcdGF3YWl0IHRoaXMubG9hZE9uZShhcHBJZCk7XHJcblx0fVxyXG5cclxuXHRwdWJsaWMgYXN5bmMgYWRkKGFwcFBhY2thZ2U6IEJ1ZmZlciwgaW5zdGFsbGF0aW9uUGFyYW1ldGVyczogSUFwcEluc3RhbGxQYXJhbWV0ZXJzKTogUHJvbWlzZTxBcHBGYWJyaWNhdGlvbkZ1bGZpbGxtZW50PiB7XHJcblx0XHRjb25zdCB7IGVuYWJsZSA9IHRydWUsIG1hcmtldHBsYWNlSW5mbywgcGVybWlzc2lvbnNHcmFudGVkLCB1c2VyIH0gPSBpbnN0YWxsYXRpb25QYXJhbWV0ZXJzO1xyXG5cclxuXHRcdGNvbnN0IGFmZiA9IG5ldyBBcHBGYWJyaWNhdGlvbkZ1bGZpbGxtZW50KCk7XHJcblx0XHRjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmdldFBhcnNlcigpLnVucGFja2FnZUFwcChhcHBQYWNrYWdlKTtcclxuXHRcdGNvbnN0IHVuZG9TdGVwczogQXJyYXk8KCkgPT4gdm9pZD4gPSBbXTtcclxuXHJcblx0XHRhZmYuc2V0QXBwSW5mbyhyZXN1bHQuaW5mbyk7XHJcblx0XHRhZmYuc2V0SW1wbGVtZW50ZWRJbnRlcmZhY2VzKHJlc3VsdC5pbXBsZW1lbnRlZC5nZXRWYWx1ZXMoKSk7XHJcblxyXG5cdFx0Y29uc3QgZGVzY3JpcHRvcjogSUFwcFN0b3JhZ2VJdGVtID0ge1xyXG5cdFx0XHRpZDogcmVzdWx0LmluZm8uaWQsXHJcblx0XHRcdGluZm86IHJlc3VsdC5pbmZvLFxyXG5cdFx0XHRzdGF0dXM6IGVuYWJsZSA/IEFwcFN0YXR1cy5NQU5VQUxMWV9FTkFCTEVEIDogQXBwU3RhdHVzLk1BTlVBTExZX0RJU0FCTEVELFxyXG5cdFx0XHRzZXR0aW5nczoge30sXHJcblx0XHRcdGltcGxlbWVudGVkOiByZXN1bHQuaW1wbGVtZW50ZWQuZ2V0VmFsdWVzKCksXHJcblx0XHRcdGluc3RhbGxhdGlvblNvdXJjZTogbWFya2V0cGxhY2VJbmZvID8gQXBwSW5zdGFsbGF0aW9uU291cmNlLk1BUktFVFBMQUNFIDogQXBwSW5zdGFsbGF0aW9uU291cmNlLlBSSVZBVEUsXHJcblx0XHRcdG1hcmtldHBsYWNlSW5mbyxcclxuXHRcdFx0cGVybWlzc2lvbnNHcmFudGVkLFxyXG5cdFx0XHRsYW5ndWFnZUNvbnRlbnQ6IHJlc3VsdC5sYW5ndWFnZUNvbnRlbnQsXHJcblx0XHR9O1xyXG5cclxuXHRcdHRyeSB7XHJcblx0XHRcdGRlc2NyaXB0b3Iuc291cmNlUGF0aCA9IGF3YWl0IHRoaXMuYXBwU291cmNlU3RvcmFnZS5zdG9yZShkZXNjcmlwdG9yLCBhcHBQYWNrYWdlKTtcclxuXHJcblx0XHRcdHVuZG9TdGVwcy5wdXNoKCgpID0+IHRoaXMuYXBwU291cmNlU3RvcmFnZS5yZW1vdmUoZGVzY3JpcHRvcikpO1xyXG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcclxuXHRcdFx0YWZmLnNldFN0b3JhZ2VFcnJvcignRmFpbGVkIHRvIHN0b3JlIGFwcCBwYWNrYWdlJyk7XHJcblxyXG5cdFx0XHRyZXR1cm4gYWZmO1xyXG5cdFx0fVxyXG5cclxuXHRcdGxldCBhcHA6IFByb3hpZWRBcHA7XHJcblxyXG5cdFx0dHJ5IHtcclxuXHRcdFx0YXBwID0gYXdhaXQgdGhpcy5nZXRDb21waWxlcigpLnRvU2FuZEJveCh0aGlzLCBkZXNjcmlwdG9yLCByZXN1bHQpO1xyXG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcclxuXHRcdFx0YXdhaXQgUHJvbWlzZS5hbGwodW5kb1N0ZXBzLm1hcCgodW5kb2VyKSA9PiB1bmRvZXIoKSkpO1xyXG5cclxuXHRcdFx0dGhyb3cgZXJyb3I7XHJcblx0XHR9XHJcblxyXG5cdFx0dW5kb1N0ZXBzLnB1c2goKCkgPT5cclxuXHRcdFx0dGhpcy5nZXRSdW50aW1lKClcclxuXHRcdFx0XHQuc3RvcFJ1bnRpbWUoYXBwLmdldFJ1bnRpbWVDb250cm9sbGVyKCkpXHJcblx0XHRcdFx0LmNhdGNoKCgpID0+IHt9KSxcclxuXHRcdCk7XHJcblxyXG5cdFx0Ly8gQ3JlYXRlIGEgdXNlciBmb3IgdGhlIGFwcFxyXG5cdFx0dHJ5IHtcclxuXHRcdFx0YXdhaXQgdGhpcy5jcmVhdGVBcHBVc2VyKHJlc3VsdC5pbmZvKTtcclxuXHJcblx0XHRcdHVuZG9TdGVwcy5wdXNoKCgpID0+IHRoaXMucmVtb3ZlQXBwVXNlcihhcHApKTtcclxuXHRcdH0gY2F0Y2ggKGVycikge1xyXG5cdFx0XHRhZmYuc2V0QXBwVXNlckVycm9yKHtcclxuXHRcdFx0XHR1c2VybmFtZTogYCR7cmVzdWx0LmluZm8ubmFtZVNsdWd9LmJvdGAsXHJcblx0XHRcdFx0bWVzc2FnZTogJ0ZhaWxlZCB0byBjcmVhdGUgYW4gYXBwIHVzZXIgZm9yIHRoaXMgYXBwLicsXHJcblx0XHRcdH0pO1xyXG5cclxuXHRcdFx0YXdhaXQgUHJvbWlzZS5hbGwodW5kb1N0ZXBzLm1hcCgodW5kb2VyKSA9PiB1bmRvZXIoKSkpO1xyXG5cclxuXHRcdFx0cmV0dXJuIGFmZjtcclxuXHRcdH1cclxuXHJcblx0XHRkZXNjcmlwdG9yLnNpZ25hdHVyZSA9IGF3YWl0IHRoaXMuZ2V0U2lnbmF0dXJlTWFuYWdlcigpLnNpZ25BcHAoZGVzY3JpcHRvcik7XHJcblx0XHRjb25zdCBjcmVhdGVkID0gYXdhaXQgdGhpcy5hcHBNZXRhZGF0YVN0b3JhZ2UuY3JlYXRlKGRlc2NyaXB0b3IpO1xyXG5cclxuXHRcdGlmICghY3JlYXRlZCkge1xyXG5cdFx0XHRhZmYuc2V0U3RvcmFnZUVycm9yKCdGYWlsZWQgdG8gY3JlYXRlIHRoZSBBcHAsIHRoZSBzdG9yYWdlIGRpZCBub3QgcmV0dXJuIGl0LicpO1xyXG5cclxuXHRcdFx0YXdhaXQgUHJvbWlzZS5hbGwodW5kb1N0ZXBzLm1hcCgodW5kb2VyKSA9PiB1bmRvZXIoKSkpO1xyXG5cclxuXHRcdFx0cmV0dXJuIGFmZjtcclxuXHRcdH1cclxuXHJcblx0XHRhcHAuZ2V0U3RvcmFnZUl0ZW0oKS5faWQgPSBjcmVhdGVkLl9pZDtcclxuXHJcblx0XHR0aGlzLmFwcHMuc2V0KGFwcC5nZXRJRCgpLCBhcHApO1xyXG5cdFx0YWZmLnNldEFwcChhcHApO1xyXG5cclxuXHRcdC8vIExldCBldmVyeW9uZSBrbm93IHRoYXQgdGhlIEFwcCBoYXMgYmVlbiBhZGRlZFxyXG5cdFx0YXdhaXQgdGhpcy5icmlkZ2VzXHJcblx0XHRcdC5nZXRBcHBBY3RpdmF0aW9uQnJpZGdlKClcclxuXHRcdFx0LmRvQXBwQWRkZWQoYXBwKVxyXG5cdFx0XHQuY2F0Y2goKCkgPT4ge1xyXG5cdFx0XHRcdC8vIElmIGFuIGVycm9yIG9jY3VycyBkdXJpbmcgdGhpcywgb2ggd2VsbC5cclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0YXdhaXQgdGhpcy5pbnN0YWxsQXBwKGFwcCwgdXNlcik7XHJcblxyXG5cdFx0Ly8gU2hvdWxkIGVuYWJsZSA9PT0gdHJ1ZSwgdGhlbiB3ZSBnbyB0aHJvdWdoIHRoZSBlbnRpcmUgc3RhcnQgdXAgcHJvY2Vzc1xyXG5cdFx0Ly8gT3RoZXJ3aXNlLCB3ZSBvbmx5IGluaXRpYWxpemUgaXQuXHJcblx0XHRpZiAoZW5hYmxlKSB7XHJcblx0XHRcdC8vIFN0YXJ0IHVwIHRoZSBhcHBcclxuXHRcdFx0YXdhaXQgdGhpcy5ydW5TdGFydFVwUHJvY2VzcyhjcmVhdGVkLCBhcHAsIGZhbHNlKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGF3YWl0IHRoaXMuaW5pdGlhbGl6ZUFwcChhcHApO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBhZmY7XHJcblx0fVxyXG5cclxuXHQvKipcclxuXHQgKiBVbmluc3RhbGxzIHNwZWNpZmllZCBhcHAgZnJvbSB0aGUgc2VydmVyIGFuZCByZW1vdmVcclxuXHQgKiBhbGwgZGF0YWJhc2UgcmVjb3JkcyByZWdhcmRpbmcgaXRcclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIHRoZSBpbnN0YW5jZSBvZiB0aGUgcmVtb3ZlZCBQcm94aWVkQXBwXHJcblx0ICovXHJcblx0cHVibGljIGFzeW5jIHJlbW92ZShpZDogc3RyaW5nLCB1bmluc3RhbGxhdGlvblBhcmFtZXRlcnM6IElBcHBVbmluc3RhbGxQYXJhbWV0ZXJzKTogUHJvbWlzZTxQcm94aWVkQXBwPiB7XHJcblx0XHRjb25zdCBhcHAgPSB0aGlzLmFwcHMuZ2V0KGlkKTtcclxuXHRcdGNvbnN0IHsgdXNlciB9ID0gdW5pbnN0YWxsYXRpb25QYXJhbWV0ZXJzO1xyXG5cclxuXHRcdC8vIEZpcnN0IHJlbW92ZSB0aGUgYXBwXHJcblx0XHRhd2FpdCB0aGlzLnVuaW5zdGFsbEFwcChhcHAsIHVzZXIpO1xyXG5cdFx0YXdhaXQgdGhpcy5yZW1vdmVMb2NhbChpZCk7XHJcblxyXG5cdFx0Ly8gVGhlbiBsZXQgZXZlcnlvbmUga25vdyB0aGF0IHRoZSBBcHAgaGFzIGJlZW4gcmVtb3ZlZFxyXG5cdFx0YXdhaXQgdGhpcy5icmlkZ2VzLmdldEFwcEFjdGl2YXRpb25CcmlkZ2UoKS5kb0FwcFJlbW92ZWQoYXBwKS5jYXRjaCgpO1xyXG5cclxuXHRcdHJldHVybiBhcHA7XHJcblx0fVxyXG5cclxuXHQvKipcclxuXHQgKiBSZW1vdmVzIHRoZSBhcHAgaW5zdGFuY2UgZnJvbSB0aGUgbG9jYWwgQXBwcyBjb250YWluZXJcclxuXHQgKiBhbmQgZXZlcnkgdHlwZSBvZiBkYXRhIGFzc29jaWF0ZWQgd2l0aCBpdFxyXG5cdCAqL1xyXG5cdHB1YmxpYyBhc3luYyByZW1vdmVMb2NhbChpZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XHJcblx0XHRjb25zdCBhcHAgPSB0aGlzLmFwcHMuZ2V0KGlkKTtcclxuXHJcblx0XHRpZiAoQXBwU3RhdHVzVXRpbHMuaXNFbmFibGVkKGF3YWl0IGFwcC5nZXRTdGF0dXMoKSkpIHtcclxuXHRcdFx0YXdhaXQgdGhpcy5kaXNhYmxlKGlkKTtcclxuXHRcdH1cclxuXHJcblx0XHRhd2FpdCB0aGlzLnB1cmdlQXBwQ29uZmlnKGFwcCk7XHJcblx0XHR0aGlzLmxpc3RlbmVyTWFuYWdlci5yZWxlYXNlRXNzZW50aWFsRXZlbnRzKGFwcCk7XHJcblx0XHRhd2FpdCB0aGlzLnJlbW92ZUFwcFVzZXIoYXBwKTtcclxuXHRcdGF3YWl0ICh0aGlzLmJyaWRnZXMuZ2V0UGVyc2lzdGVuY2VCcmlkZ2UoKSBhcyBJSW50ZXJuYWxQZXJzaXN0ZW5jZUJyaWRnZSAmIFBlcnNpc3RlbmNlQnJpZGdlKS5wdXJnZShhcHAuZ2V0SUQoKSk7XHJcblx0XHRhd2FpdCB0aGlzLmFwcE1ldGFkYXRhU3RvcmFnZS5yZW1vdmUoYXBwLmdldElEKCkpO1xyXG5cdFx0YXdhaXQgdGhpcy5hcHBTb3VyY2VTdG9yYWdlLnJlbW92ZShhcHAuZ2V0U3RvcmFnZUl0ZW0oKSkuY2F0Y2goKCkgPT4ge30pO1xyXG5cclxuXHRcdC8vIEVycm9ycyBoZXJlIGRvbid0IHJlYWxseSBwcmV2ZW50IHRoZSBwcm9jZXNzIGZyb20gZHlpbmcsIHNvIHdlIGRvbid0IHJlYWxseSBuZWVkIHRvIGRvIGFueXRoaW5nIG9uIHRoZSBjYXRjaFxyXG5cdFx0YXdhaXQgdGhpcy5nZXRSdW50aW1lKClcclxuXHRcdFx0LnN0b3BSdW50aW1lKGFwcC5nZXRSdW50aW1lQ29udHJvbGxlcigpKVxyXG5cdFx0XHQuY2F0Y2goKCkgPT4ge30pO1xyXG5cclxuXHRcdHRoaXMuYXBwcy5kZWxldGUoYXBwLmdldElEKCkpO1xyXG5cdH1cclxuXHJcblx0cHVibGljIGFzeW5jIHVwZGF0ZShcclxuXHRcdGFwcFBhY2thZ2U6IEJ1ZmZlcixcclxuXHRcdHBlcm1pc3Npb25zR3JhbnRlZDogQXJyYXk8SVBlcm1pc3Npb24+LFxyXG5cdFx0dXBkYXRlT3B0aW9uczogeyBsb2FkQXBwPzogYm9vbGVhbjsgdXNlcj86IElVc2VyIH0gPSB7IGxvYWRBcHA6IHRydWUgfSxcclxuXHQpOiBQcm9taXNlPEFwcEZhYnJpY2F0aW9uRnVsZmlsbG1lbnQ+IHtcclxuXHRcdGNvbnN0IGFmZiA9IG5ldyBBcHBGYWJyaWNhdGlvbkZ1bGZpbGxtZW50KCk7XHJcblx0XHRjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmdldFBhcnNlcigpLnVucGFja2FnZUFwcChhcHBQYWNrYWdlKTtcclxuXHJcblx0XHRhZmYuc2V0QXBwSW5mbyhyZXN1bHQuaW5mbyk7XHJcblx0XHRhZmYuc2V0SW1wbGVtZW50ZWRJbnRlcmZhY2VzKHJlc3VsdC5pbXBsZW1lbnRlZC5nZXRWYWx1ZXMoKSk7XHJcblxyXG5cdFx0Y29uc3Qgb2xkID0gYXdhaXQgdGhpcy5hcHBNZXRhZGF0YVN0b3JhZ2UucmV0cmlldmVPbmUocmVzdWx0LmluZm8uaWQpO1xyXG5cclxuXHRcdGlmICghb2xkKSB7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcignQ2FuIG5vdCB1cGRhdGUgYW4gQXBwIHRoYXQgZG9lcyBub3QgY3VycmVudGx5IGV4aXN0LicpO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vIElmIHRoZXJlIGlzIGFueSBlcnJvciBkdXJpbmcgZGlzYWJsaW5nLCBpdCBkb2Vzbid0IHJlYWxseSBtYXR0ZXJcclxuXHRcdGF3YWl0IHRoaXMuZGlzYWJsZShvbGQuaWQpLmNhdGNoKCgpID0+IHt9KTtcclxuXHJcblx0XHRjb25zdCBkZXNjcmlwdG9yOiBJQXBwU3RvcmFnZUl0ZW0gPSB7XHJcblx0XHRcdC4uLm9sZCxcclxuXHRcdFx0aWQ6IHJlc3VsdC5pbmZvLmlkLFxyXG5cdFx0XHRpbmZvOiByZXN1bHQuaW5mbyxcclxuXHRcdFx0bGFuZ3VhZ2VDb250ZW50OiByZXN1bHQubGFuZ3VhZ2VDb250ZW50LFxyXG5cdFx0XHRpbXBsZW1lbnRlZDogcmVzdWx0LmltcGxlbWVudGVkLmdldFZhbHVlcygpLFxyXG5cdFx0fTtcclxuXHJcblx0XHRpZiAoIXBlcm1pc3Npb25zR3JhbnRlZCkge1xyXG5cdFx0XHRkZWxldGUgZGVzY3JpcHRvci5wZXJtaXNzaW9uc0dyYW50ZWQ7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRkZXNjcmlwdG9yLnBlcm1pc3Npb25zR3JhbnRlZCA9IHBlcm1pc3Npb25zR3JhbnRlZDtcclxuXHRcdH1cclxuXHJcblx0XHR0cnkge1xyXG5cdFx0XHRkZXNjcmlwdG9yLnNvdXJjZVBhdGggPSBhd2FpdCB0aGlzLmFwcFNvdXJjZVN0b3JhZ2UudXBkYXRlKGRlc2NyaXB0b3IsIGFwcFBhY2thZ2UpO1xyXG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcclxuXHRcdFx0YWZmLnNldFN0b3JhZ2VFcnJvcignRmFpbGVkIHRvIHN0b3JhZ2UgYXBwIHBhY2thZ2UnKTtcclxuXHJcblx0XHRcdHJldHVybiBhZmY7XHJcblx0XHR9XHJcblxyXG5cdFx0ZGVzY3JpcHRvci5zaWduYXR1cmUgPSBhd2FpdCB0aGlzLnNpZ25hdHVyZU1hbmFnZXIuc2lnbkFwcChkZXNjcmlwdG9yKTtcclxuXHRcdGNvbnN0IHN0b3JlZCA9IGF3YWl0IHRoaXMuYXBwTWV0YWRhdGFTdG9yYWdlLnVwZGF0ZVBhcnRpYWxBbmRSZXR1cm5Eb2N1bWVudChkZXNjcmlwdG9yLCB7XHJcblx0XHRcdHVuc2V0UGVybWlzc2lvbnNHcmFudGVkOiB0eXBlb2YgcGVybWlzc2lvbnNHcmFudGVkID09PSAndW5kZWZpbmVkJyxcclxuXHRcdH0pO1xyXG5cclxuXHRcdC8vIEVycm9ycyBoZXJlIGRvbid0IHJlYWxseSBwcmV2ZW50IHRoZSBwcm9jZXNzIGZyb20gZHlpbmcsIHNvIHdlIGRvbid0IHJlYWxseSBuZWVkIHRvIGRvIGFueXRoaW5nIG9uIHRoZSBjYXRjaFxyXG5cdFx0YXdhaXQgdGhpcy5nZXRSdW50aW1lKClcclxuXHRcdFx0LnN0b3BSdW50aW1lKHRoaXMuYXBwcy5nZXQob2xkLmlkKS5nZXRSdW50aW1lQ29udHJvbGxlcigpKVxyXG5cdFx0XHQuY2F0Y2goKCkgPT4ge30pO1xyXG5cclxuXHRcdGNvbnN0IGFwcCA9IGF3YWl0IHRoaXMuZ2V0Q29tcGlsZXIoKS50b1NhbmRCb3godGhpcywgZGVzY3JpcHRvciwgcmVzdWx0KTtcclxuXHJcblx0XHQvLyBFbnN1cmUgdGhlcmUgaXMgYW4gdXNlciBmb3IgdGhlIGFwcFxyXG5cdFx0dHJ5IHtcclxuXHRcdFx0YXdhaXQgdGhpcy5jcmVhdGVBcHBVc2VyKHJlc3VsdC5pbmZvKTtcclxuXHRcdH0gY2F0Y2ggKGVycikge1xyXG5cdFx0XHRhZmYuc2V0QXBwVXNlckVycm9yKHtcclxuXHRcdFx0XHR1c2VybmFtZTogYCR7cmVzdWx0LmluZm8ubmFtZVNsdWd9LmJvdGAsXHJcblx0XHRcdFx0bWVzc2FnZTogJ0ZhaWxlZCB0byBjcmVhdGUgYW4gYXBwIHVzZXIgZm9yIHRoaXMgYXBwLicsXHJcblx0XHRcdH0pO1xyXG5cclxuXHRcdFx0cmV0dXJuIGFmZjtcclxuXHRcdH1cclxuXHJcblx0XHRhZmYuc2V0QXBwKGFwcCk7XHJcblxyXG5cdFx0aWYgKHVwZGF0ZU9wdGlvbnMubG9hZEFwcCkge1xyXG5cdFx0XHRjb25zdCBzaG91bGRFbmFibGVBcHAgPSBBcHBTdGF0dXNVdGlscy5pc0VuYWJsZWQob2xkLnN0YXR1cyk7XHJcblx0XHRcdGlmIChzaG91bGRFbmFibGVBcHApIHtcclxuXHRcdFx0XHRhd2FpdCB0aGlzLnVwZGF0ZUFuZFN0YXJ0dXBMb2NhbChzdG9yZWQsIGFwcCk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0YXdhaXQgdGhpcy51cGRhdGVBbmRJbml0aWFsaXplTG9jYWwoc3RvcmVkLCBhcHApO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRhd2FpdCB0aGlzLmJyaWRnZXNcclxuXHRcdFx0XHQuZ2V0QXBwQWN0aXZhdGlvbkJyaWRnZSgpXHJcblx0XHRcdFx0LmRvQXBwVXBkYXRlZChhcHApXHJcblx0XHRcdFx0LmNhdGNoKCgpID0+IHt9KTtcclxuXHRcdH1cclxuXHJcblx0XHRhd2FpdCB0aGlzLnVwZGF0ZUFwcChhcHAsIHVwZGF0ZU9wdGlvbnMudXNlciwgb2xkLmluZm8udmVyc2lvbik7XHJcblxyXG5cdFx0cmV0dXJuIGFmZjtcclxuXHR9XHJcblxyXG5cdC8qKlxyXG5cdCAqIFVwZGF0ZXMgdGhlIGxvY2FsIGluc3RhbmNlIG9mIGFuIGFwcC5cclxuXHQgKlxyXG5cdCAqIElmIHRoZSBzZWNvbmQgcGFyYW1ldGVyIGlzIGEgQnVmZmVyIG9mIGFuIGFwcCBwYWNrYWdlLFxyXG5cdCAqIHVucGFja2FnZSBhbmQgaW5zdGFudGlhdGUgdGhlIGFwcCdzIG1haW4gY2xhc3NcclxuXHQgKlxyXG5cdCAqIFdpdGggYW4gaW5zdGFuY2Ugb2YgYSBQcm94aWVkQXBwLCBzdGFydCBpdCB1cCBhbmQgcmVwbGFjZVxyXG5cdCAqIHRoZSByZWZlcmVuY2UgaW4gdGhlIGxvY2FsIGFwcCBjb2xsZWN0aW9uXHJcblx0ICovXHJcblx0YXN5bmMgdXBkYXRlTG9jYWwoc3RvcmVkOiBJQXBwU3RvcmFnZUl0ZW0sIGFwcFBhY2thZ2VPckluc3RhbmNlOiBQcm94aWVkQXBwIHwgQnVmZmVyKTogUHJvbWlzZTxQcm94aWVkQXBwPiB7XHJcblx0XHRjb25zdCBhcHAgPSBhd2FpdCAoYXN5bmMgKCkgPT4ge1xyXG5cdFx0XHRpZiAoYXBwUGFja2FnZU9ySW5zdGFuY2UgaW5zdGFuY2VvZiBCdWZmZXIpIHtcclxuXHRcdFx0XHRjb25zdCBwYXJzZVJlc3VsdCA9IGF3YWl0IHRoaXMuZ2V0UGFyc2VyKCkudW5wYWNrYWdlQXBwKGFwcFBhY2thZ2VPckluc3RhbmNlKTtcclxuXHJcblx0XHRcdFx0Ly8gRXJyb3JzIGhlcmUgZG9uJ3QgcmVhbGx5IHByZXZlbnQgdGhlIHByb2Nlc3MgZnJvbSBkeWluZywgc28gd2UgZG9uJ3QgcmVhbGx5IG5lZWQgdG8gZG8gYW55dGhpbmcgb24gdGhlIGNhdGNoXHJcblx0XHRcdFx0YXdhaXQgdGhpcy5nZXRSdW50aW1lKClcclxuXHRcdFx0XHRcdC5zdG9wUnVudGltZSh0aGlzLmFwcHMuZ2V0KHN0b3JlZC5pZCkuZ2V0UnVudGltZUNvbnRyb2xsZXIoKSlcclxuXHRcdFx0XHRcdC5jYXRjaCgoKSA9PiB7fSk7XHJcblxyXG5cdFx0XHRcdHJldHVybiB0aGlzLmdldENvbXBpbGVyKCkudG9TYW5kQm94KHRoaXMsIHN0b3JlZCwgcGFyc2VSZXN1bHQpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiAoYXBwUGFja2FnZU9ySW5zdGFuY2UgaW5zdGFuY2VvZiBQcm94aWVkQXBwKSB7XHJcblx0XHRcdFx0cmV0dXJuIGFwcFBhY2thZ2VPckluc3RhbmNlO1xyXG5cdFx0XHR9XHJcblx0XHR9KSgpO1xyXG5cclxuXHRcdC8vIFdlIGRvbid0IGtlZXAgc2xhc2hjb21tYW5kcyBoZXJlIGFzIHRoZSB1cGRhdGUgY291bGQgcG90ZW50aWFsbHkgbm90IHByb3ZpZGUgdGhlIHNhbWUgbGlzdFxyXG5cdFx0YXdhaXQgdGhpcy5wdXJnZUFwcENvbmZpZyhhcHAsIHsga2VlcFNjaGVkdWxlZEpvYnM6IHRydWUgfSk7XHJcblxyXG5cdFx0dGhpcy5hcHBzLnNldChhcHAuZ2V0SUQoKSwgYXBwKTtcclxuXHRcdHJldHVybiBhcHA7XHJcblx0fVxyXG5cclxuXHRwdWJsaWMgYXN5bmMgdXBkYXRlQW5kU3RhcnR1cExvY2FsKHN0b3JlZDogSUFwcFN0b3JhZ2VJdGVtLCBhcHBQYWNrYWdlT3JJbnN0YW5jZTogUHJveGllZEFwcCB8IEJ1ZmZlcikge1xyXG5cdFx0Y29uc3QgYXBwID0gYXdhaXQgdGhpcy51cGRhdGVMb2NhbChzdG9yZWQsIGFwcFBhY2thZ2VPckluc3RhbmNlKTtcclxuXHRcdGF3YWl0IHRoaXMucnVuU3RhcnRVcFByb2Nlc3Moc3RvcmVkLCBhcHAsIHRydWUpO1xyXG5cdH1cclxuXHJcblx0cHVibGljIGFzeW5jIHVwZGF0ZUFuZEluaXRpYWxpemVMb2NhbChzdG9yZWQ6IElBcHBTdG9yYWdlSXRlbSwgYXBwUGFja2FnZU9ySW5zdGFuY2U6IFByb3hpZWRBcHAgfCBCdWZmZXIpIHtcclxuXHRcdGNvbnN0IGFwcCA9IGF3YWl0IHRoaXMudXBkYXRlTG9jYWwoc3RvcmVkLCBhcHBQYWNrYWdlT3JJbnN0YW5jZSk7XHJcblx0XHRhd2FpdCB0aGlzLmluaXRpYWxpemVBcHAoYXBwLCB0cnVlKTtcclxuXHR9XHJcblxyXG5cdHB1YmxpYyBnZXRMYW5ndWFnZUNvbnRlbnQoKTogeyBba2V5OiBzdHJpbmddOiBvYmplY3QgfSB7XHJcblx0XHRjb25zdCBsYW5nczogeyBba2V5OiBzdHJpbmddOiBvYmplY3QgfSA9IHt9O1xyXG5cclxuXHRcdHRoaXMuYXBwcy5mb3JFYWNoKChybCkgPT4ge1xyXG5cdFx0XHRjb25zdCBjb250ZW50ID0gcmwuZ2V0U3RvcmFnZUl0ZW0oKS5sYW5ndWFnZUNvbnRlbnQ7XHJcblxyXG5cdFx0XHRPYmplY3Qua2V5cyhjb250ZW50KS5mb3JFYWNoKChrZXkpID0+IHtcclxuXHRcdFx0XHRsYW5nc1trZXldID0gT2JqZWN0LmFzc2lnbihsYW5nc1trZXldIHx8IHt9LCBjb250ZW50W2tleV0pO1xyXG5cdFx0XHR9KTtcclxuXHRcdH0pO1xyXG5cclxuXHRcdHJldHVybiBsYW5ncztcclxuXHR9XHJcblxyXG5cdHB1YmxpYyBhc3luYyBjaGFuZ2VTdGF0dXMoYXBwSWQ6IHN0cmluZywgc3RhdHVzOiBBcHBTdGF0dXMpOiBQcm9taXNlPFByb3hpZWRBcHA+IHtcclxuXHRcdHN3aXRjaCAoc3RhdHVzKSB7XHJcblx0XHRcdGNhc2UgQXBwU3RhdHVzLk1BTlVBTExZX0RJU0FCTEVEOlxyXG5cdFx0XHRjYXNlIEFwcFN0YXR1cy5NQU5VQUxMWV9FTkFCTEVEOlxyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRkZWZhdWx0OlxyXG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBzdGF0dXMgdG8gY2hhbmdlIGFuIEFwcCB0bywgbXVzdCBiZSBtYW51YWxseSBkaXNhYmxlZCBvciBlbmFibGVkLicpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGNvbnN0IHJsID0gdGhpcy5hcHBzLmdldChhcHBJZCk7XHJcblxyXG5cdFx0aWYgKCFybCkge1xyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0NhbiBub3QgY2hhbmdlIHRoZSBzdGF0dXMgb2YgYW4gQXBwIHdoaWNoIGRvZXMgbm90IGN1cnJlbnRseSBleGlzdC4nKTtcclxuXHRcdH1cclxuXHJcblx0XHRjb25zdCBzdG9yYWdlSXRlbSA9IGF3YWl0IHJsLmdldFN0b3JhZ2VJdGVtKCk7XHJcblxyXG5cdFx0aWYgKEFwcFN0YXR1c1V0aWxzLmlzRW5hYmxlZChzdGF0dXMpKSB7XHJcblx0XHRcdC8vIFRoZW4gZW5hYmxlIGl0XHJcblx0XHRcdGlmIChBcHBTdGF0dXNVdGlscy5pc0VuYWJsZWQoYXdhaXQgcmwuZ2V0U3RhdHVzKCkpKSB7XHJcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdDYW4gbm90IGVuYWJsZSBhbiBBcHAgd2hpY2ggaXMgYWxyZWFkeSBlbmFibGVkLicpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRhd2FpdCB0aGlzLmVuYWJsZShybC5nZXRJRCgpKTtcclxuXHJcblx0XHRcdHN0b3JhZ2VJdGVtLnN0YXR1cyA9IEFwcFN0YXR1cy5NQU5VQUxMWV9FTkFCTEVEO1xyXG5cdFx0XHRhd2FpdCB0aGlzLmFwcE1ldGFkYXRhU3RvcmFnZS51cGRhdGVTdGF0dXMoc3RvcmFnZUl0ZW0uX2lkLCBBcHBTdGF0dXMuTUFOVUFMTFlfRU5BQkxFRCk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRpZiAoIUFwcFN0YXR1c1V0aWxzLmlzRW5hYmxlZChhd2FpdCBybC5nZXRTdGF0dXMoKSkpIHtcclxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0NhbiBub3QgZGlzYWJsZSBhbiBBcHAgd2hpY2ggaXMgbm90IGVuYWJsZWQuJyk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGF3YWl0IHRoaXMuZGlzYWJsZShybC5nZXRJRCgpLCBBcHBTdGF0dXMuTUFOVUFMTFlfRElTQUJMRUQpO1xyXG5cclxuXHRcdFx0c3RvcmFnZUl0ZW0uc3RhdHVzID0gQXBwU3RhdHVzLk1BTlVBTExZX0RJU0FCTEVEO1xyXG5cdFx0XHRhd2FpdCB0aGlzLmFwcE1ldGFkYXRhU3RvcmFnZS51cGRhdGVTdGF0dXMoc3RvcmFnZUl0ZW0uX2lkLCBBcHBTdGF0dXMuTUFOVUFMTFlfRElTQUJMRUQpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBybDtcclxuXHR9XHJcblxyXG5cdHB1YmxpYyBhc3luYyB1cGRhdGVBcHBzTWFya2V0cGxhY2VJbmZvKGFwcHNPdmVydmlldzogQXJyYXk8eyBsYXRlc3Q6IElNYXJrZXRwbGFjZUluZm8gfT4pOiBQcm9taXNlPHZvaWQ+IHtcclxuXHRcdGF3YWl0IFByb21pc2UuYWxsKFxyXG5cdFx0XHRhcHBzT3ZlcnZpZXcubWFwKGFzeW5jICh7IGxhdGVzdDogYXBwSW5mbyB9KSA9PiB7XHJcblx0XHRcdFx0aWYgKCFhcHBJbmZvLnN1YnNjcmlwdGlvbkluZm8pIHtcclxuXHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdGNvbnN0IGFwcCA9IHRoaXMuYXBwcy5nZXQoYXBwSW5mby5pZCk7XHJcblxyXG5cdFx0XHRcdGlmICghYXBwKSB7XHJcblx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRjb25zdCBhcHBTdG9yYWdlSXRlbSA9IGFwcC5nZXRTdG9yYWdlSXRlbSgpO1xyXG5cdFx0XHRcdGNvbnN0IHsgc3Vic2NyaXB0aW9uSW5mbyB9ID0gYXBwU3RvcmFnZUl0ZW0ubWFya2V0cGxhY2VJbmZvPy5bMF0gfHwge307XHJcblxyXG5cdFx0XHRcdGlmIChzdWJzY3JpcHRpb25JbmZvICYmIHN1YnNjcmlwdGlvbkluZm8ubGljZW5zZS5saWNlbnNlID09PSBhcHBJbmZvLnN1YnNjcmlwdGlvbkluZm8ubGljZW5zZS5saWNlbnNlKSB7XHJcblx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRhcHBTdG9yYWdlSXRlbS5tYXJrZXRwbGFjZUluZm9bMF0uc3Vic2NyaXB0aW9uSW5mbyA9IGFwcEluZm8uc3Vic2NyaXB0aW9uSW5mbztcclxuXHRcdFx0XHRhcHBTdG9yYWdlSXRlbS5zaWduYXR1cmUgPSBhd2FpdCB0aGlzLmdldFNpZ25hdHVyZU1hbmFnZXIoKS5zaWduQXBwKGFwcFN0b3JhZ2VJdGVtKTtcclxuXHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuYXBwTWV0YWRhdGFTdG9yYWdlLnVwZGF0ZVBhcnRpYWxBbmRSZXR1cm5Eb2N1bWVudCh7XHJcblx0XHRcdFx0XHRfaWQ6IGFwcFN0b3JhZ2VJdGVtLl9pZCxcclxuXHRcdFx0XHRcdG1hcmtldHBsYWNlSW5mbzogYXBwU3RvcmFnZUl0ZW0ubWFya2V0cGxhY2VJbmZvLFxyXG5cdFx0XHRcdFx0c2lnbmF0dXJlOiBhcHBTdG9yYWdlSXRlbS5zaWduYXR1cmUsXHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH0pLFxyXG5cdFx0KS5jYXRjaCgoKSA9PiB7fSk7XHJcblxyXG5cdFx0Y29uc3QgcXVldWUgPSBbXSBhcyBBcnJheTxQcm9taXNlPHZvaWQ+PjtcclxuXHJcblx0XHR0aGlzLmFwcHMuZm9yRWFjaCgoYXBwKSA9PlxyXG5cdFx0XHRxdWV1ZS5wdXNoKFxyXG5cdFx0XHRcdGFwcFxyXG5cdFx0XHRcdFx0LnZhbGlkYXRlTGljZW5zZSgpXHJcblx0XHRcdFx0XHQudGhlbihhc3luYyAoKSA9PiB7XHJcblx0XHRcdFx0XHRcdGlmICgoYXdhaXQgYXBwLmdldFN0YXR1cygpKSAhPT0gQXBwU3RhdHVzLklOVkFMSURfTElDRU5TRV9ESVNBQkxFRCkge1xyXG5cdFx0XHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFx0cmV0dXJuIGFwcC5zZXRTdGF0dXMoQXBwU3RhdHVzLkRJU0FCTEVEKTtcclxuXHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0XHQuY2F0Y2goYXN5bmMgKGVycm9yKSA9PiB7XHJcblx0XHRcdFx0XHRcdGlmICghKGVycm9yIGluc3RhbmNlb2YgSW52YWxpZExpY2Vuc2VFcnJvcikpIHtcclxuXHRcdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKGVycm9yKTtcclxuXHRcdFx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdGF3YWl0IHRoaXMucHVyZ2VBcHBDb25maWcoYXBwLCB7IGtlZXBTY2hlZHVsZWRKb2JzOiB0cnVlIH0pO1xyXG5cclxuXHRcdFx0XHRcdFx0cmV0dXJuIGFwcC5zZXRTdGF0dXMoQXBwU3RhdHVzLklOVkFMSURfTElDRU5TRV9ESVNBQkxFRCk7XHJcblx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdFx0LnRoZW4oYXN5bmMgKCkgPT4ge1xyXG5cdFx0XHRcdFx0XHRjb25zdCBzdGF0dXMgPSBhd2FpdCBhcHAuZ2V0U3RhdHVzKCk7XHJcblx0XHRcdFx0XHRcdGlmIChzdGF0dXMgPT09IGFwcC5nZXRQcmV2aW91c1N0YXR1cygpKSB7XHJcblx0XHRcdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0XHRjb25zdCBzdG9yYWdlSXRlbSA9IGFwcC5nZXRTdG9yYWdlSXRlbSgpO1xyXG5cdFx0XHRcdFx0XHRzdG9yYWdlSXRlbS5zdGF0dXMgPSBzdGF0dXM7XHJcblxyXG5cdFx0XHRcdFx0XHRyZXR1cm4gdGhpcy5hcHBNZXRhZGF0YVN0b3JhZ2UudXBkYXRlU3RhdHVzKHN0b3JhZ2VJdGVtLl9pZCwgc3RvcmFnZUl0ZW0uc3RhdHVzKS5jYXRjaChjb25zb2xlLmVycm9yKSBhcyBQcm9taXNlPHZvaWQ+O1xyXG5cdFx0XHRcdFx0fSksXHJcblx0XHRcdCksXHJcblx0XHQpO1xyXG5cclxuXHRcdGF3YWl0IFByb21pc2UuYWxsKHF1ZXVlKTtcclxuXHR9XHJcblxyXG5cdC8qKlxyXG5cdCAqIEdvZXMgdGhyb3VnaCB0aGUgZW50aXJlIGxvYWRpbmcgdXAgcHJvY2Vzcy5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSBhcHBJZCB0aGUgaWQgb2YgdGhlIGFwcGxpY2F0aW9uIHRvIGxvYWRcclxuXHQgKi9cclxuXHRwdWJsaWMgYXN5bmMgbG9hZE9uZShhcHBJZDogc3RyaW5nLCBzaWxlbmNlU3RhdHVzID0gZmFsc2UpOiBQcm9taXNlPFByb3hpZWRBcHA+IHtcclxuXHRcdGNvbnN0IHJsID0gdGhpcy5hcHBzLmdldChhcHBJZCk7XHJcblxyXG5cdFx0aWYgKCFybCkge1xyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYE5vIEFwcCBmb3VuZCBieSB0aGUgaWQgb2Y6IFwiJHthcHBJZH1cImApO1xyXG5cdFx0fVxyXG5cclxuXHRcdGNvbnN0IGl0ZW0gPSBybC5nZXRTdG9yYWdlSXRlbSgpO1xyXG5cclxuXHRcdGF3YWl0IHRoaXMuaW5pdGlhbGl6ZUFwcChybCwgc2lsZW5jZVN0YXR1cyk7XHJcblxyXG5cdFx0aWYgKCF0aGlzLmFyZVJlcXVpcmVkU2V0dGluZ3NTZXQoaXRlbSkpIHtcclxuXHRcdFx0YXdhaXQgcmwuc2V0U3RhdHVzKEFwcFN0YXR1cy5JTlZBTElEX1NFVFRJTkdTX0RJU0FCTEVEKTtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoIUFwcFN0YXR1c1V0aWxzLmlzRGlzYWJsZWQoYXdhaXQgcmwuZ2V0U3RhdHVzKCkpICYmIEFwcFN0YXR1c1V0aWxzLmlzRW5hYmxlZChybC5nZXRQcmV2aW91c1N0YXR1cygpKSkge1xyXG5cdFx0XHRhd2FpdCB0aGlzLmVuYWJsZUFwcChybCwgc2lsZW5jZVN0YXR1cyk7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHRoaXMuYXBwcy5nZXQoaXRlbS5pZCk7XHJcblx0fVxyXG5cclxuXHRwcml2YXRlIGFzeW5jIHJ1blN0YXJ0VXBQcm9jZXNzKHN0b3JhZ2VJdGVtOiBJQXBwU3RvcmFnZUl0ZW0sIGFwcDogUHJveGllZEFwcCwgc2lsZW5jZVN0YXR1czogYm9vbGVhbik6IFByb21pc2U8Ym9vbGVhbj4ge1xyXG5cdFx0aWYgKChhd2FpdCBhcHAuZ2V0U3RhdHVzKCkpICE9PSBBcHBTdGF0dXMuSU5JVElBTElaRUQpIHtcclxuXHRcdFx0Y29uc3QgaXNJbml0aWFsaXplZCA9IGF3YWl0IHRoaXMuaW5pdGlhbGl6ZUFwcChhcHAsIHNpbGVuY2VTdGF0dXMpO1xyXG5cdFx0XHRpZiAoIWlzSW5pdGlhbGl6ZWQpIHtcclxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRpZiAoIXRoaXMuYXJlUmVxdWlyZWRTZXR0aW5nc1NldChzdG9yYWdlSXRlbSkpIHtcclxuXHRcdFx0YXdhaXQgYXBwLnNldFN0YXR1cyhBcHBTdGF0dXMuSU5WQUxJRF9TRVRUSU5HU19ESVNBQkxFRCwgc2lsZW5jZVN0YXR1cyk7XHJcblx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gdGhpcy5lbmFibGVBcHAoYXBwLCBzaWxlbmNlU3RhdHVzKTtcclxuXHR9XHJcblxyXG5cdHByaXZhdGUgYXN5bmMgaW5zdGFsbEFwcChhcHA6IFByb3hpZWRBcHAsIHVzZXI6IElVc2VyKTogUHJvbWlzZTxib29sZWFuPiB7XHJcblx0XHRsZXQgcmVzdWx0OiBib29sZWFuO1xyXG5cdFx0Y29uc3QgY29udGV4dCA9IHsgdXNlciB9O1xyXG5cclxuXHRcdHRyeSB7XHJcblx0XHRcdGF3YWl0IGFwcC5jYWxsKEFwcE1ldGhvZC5PTklOU1RBTEwsIGNvbnRleHQpO1xyXG5cclxuXHRcdFx0cmVzdWx0ID0gdHJ1ZTtcclxuXHRcdH0gY2F0Y2ggKGUpIHtcclxuXHRcdFx0Y29uc3Qgc3RhdHVzID0gQXBwU3RhdHVzLkVSUk9SX0RJU0FCTEVEO1xyXG5cclxuXHRcdFx0cmVzdWx0ID0gZmFsc2U7XHJcblxyXG5cdFx0XHRhd2FpdCBhcHAuc2V0U3RhdHVzKHN0YXR1cyk7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHJlc3VsdDtcclxuXHR9XHJcblxyXG5cdHByaXZhdGUgYXN5bmMgdXBkYXRlQXBwKGFwcDogUHJveGllZEFwcCwgdXNlcjogSVVzZXIgfCBudWxsLCBvbGRBcHBWZXJzaW9uOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcclxuXHRcdGxldCByZXN1bHQ6IGJvb2xlYW47XHJcblxyXG5cdFx0dHJ5IHtcclxuXHRcdFx0YXdhaXQgYXBwLmNhbGwoQXBwTWV0aG9kLk9OVVBEQVRFLCB7IG9sZEFwcFZlcnNpb24sIHVzZXIgfSk7XHJcblxyXG5cdFx0XHRyZXN1bHQgPSB0cnVlO1xyXG5cdFx0fSBjYXRjaCAoZSkge1xyXG5cdFx0XHRjb25zdCBzdGF0dXMgPSBBcHBTdGF0dXMuRVJST1JfRElTQUJMRUQ7XHJcblxyXG5cdFx0XHRyZXN1bHQgPSBmYWxzZTtcclxuXHJcblx0XHRcdGF3YWl0IGFwcC5zZXRTdGF0dXMoc3RhdHVzKTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gcmVzdWx0O1xyXG5cdH1cclxuXHJcblx0cHJpdmF0ZSBhc3luYyBpbml0aWFsaXplQXBwKGFwcDogUHJveGllZEFwcCwgc2lsZW5jZVN0YXR1cyA9IGZhbHNlKTogUHJvbWlzZTxib29sZWFuPiB7XHJcblx0XHRsZXQgcmVzdWx0OiBib29sZWFuO1xyXG5cclxuXHRcdHRyeSB7XHJcblx0XHRcdGF3YWl0IGFwcC52YWxpZGF0ZUxpY2Vuc2UoKTtcclxuXHRcdFx0YXdhaXQgYXBwLnZhbGlkYXRlSW5zdGFsbGF0aW9uKCk7XHJcblxyXG5cdFx0XHRhd2FpdCBhcHAuY2FsbChBcHBNZXRob2QuSU5JVElBTElaRSk7XHJcblx0XHRcdGF3YWl0IGFwcC5zZXRTdGF0dXMoQXBwU3RhdHVzLklOSVRJQUxJWkVELCBzaWxlbmNlU3RhdHVzKTtcclxuXHJcblx0XHRcdGF3YWl0IHRoaXMuY29tbWFuZE1hbmFnZXIucmVnaXN0ZXJDb21tYW5kcyhhcHAuZ2V0SUQoKSk7XHJcblxyXG5cdFx0XHRyZXN1bHQgPSB0cnVlO1xyXG5cdFx0fSBjYXRjaCAoZSkge1xyXG5cdFx0XHRsZXQgc3RhdHVzID0gQXBwU3RhdHVzLkVSUk9SX0RJU0FCTEVEO1xyXG5cclxuXHRcdFx0aWYgKGUgaW5zdGFuY2VvZiBJbnZhbGlkTGljZW5zZUVycm9yKSB7XHJcblx0XHRcdFx0c3RhdHVzID0gQXBwU3RhdHVzLklOVkFMSURfTElDRU5TRV9ESVNBQkxFRDtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgKGUgaW5zdGFuY2VvZiBJbnZhbGlkSW5zdGFsbGF0aW9uRXJyb3IpIHtcclxuXHRcdFx0XHRzdGF0dXMgPSBBcHBTdGF0dXMuSU5WQUxJRF9JTlNUQUxMQVRJT05fRElTQUJMRUQ7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGF3YWl0IHRoaXMucHVyZ2VBcHBDb25maWcoYXBwKTtcclxuXHRcdFx0cmVzdWx0ID0gZmFsc2U7XHJcblxyXG5cdFx0XHRhd2FpdCBhcHAuc2V0U3RhdHVzKHN0YXR1cywgc2lsZW5jZVN0YXR1cyk7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHJlc3VsdDtcclxuXHR9XHJcblxyXG5cdHByaXZhdGUgYXN5bmMgcHVyZ2VBcHBDb25maWcoYXBwOiBQcm94aWVkQXBwLCBvcHRzOiBJUHVyZ2VBcHBDb25maWdPcHRzID0ge30pIHtcclxuXHRcdGlmICghb3B0cy5rZWVwU2NoZWR1bGVkSm9icykge1xyXG5cdFx0XHRhd2FpdCB0aGlzLnNjaGVkdWxlck1hbmFnZXIuY2xlYW5VcChhcHAuZ2V0SUQoKSk7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKCFvcHRzLmtlZXBTbGFzaGNvbW1hbmRzKSB7XHJcblx0XHRcdGF3YWl0IHRoaXMuY29tbWFuZE1hbmFnZXIudW5yZWdpc3RlckNvbW1hbmRzKGFwcC5nZXRJRCgpKTtcclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLmxpc3RlbmVyTWFuYWdlci51bnJlZ2lzdGVyTGlzdGVuZXJzKGFwcCk7XHJcblx0XHR0aGlzLmxpc3RlbmVyTWFuYWdlci5sb2NrRXNzZW50aWFsRXZlbnRzKGFwcCk7XHJcblx0XHR0aGlzLmV4dGVybmFsQ29tcG9uZW50TWFuYWdlci51bnJlZ2lzdGVyRXh0ZXJuYWxDb21wb25lbnRzKGFwcC5nZXRJRCgpKTtcclxuXHRcdGF3YWl0IHRoaXMuYXBpTWFuYWdlci51bnJlZ2lzdGVyQXBpcyhhcHAuZ2V0SUQoKSk7XHJcblx0XHR0aGlzLmFjY2Vzc29yTWFuYWdlci5wdXJpZnlBcHAoYXBwLmdldElEKCkpO1xyXG5cdFx0dGhpcy51aUFjdGlvbkJ1dHRvbk1hbmFnZXIuY2xlYXJBcHBBY3Rpb25CdXR0b25zKGFwcC5nZXRJRCgpKTtcclxuXHRcdHRoaXMudmlkZW9Db25mUHJvdmlkZXJNYW5hZ2VyLnVucmVnaXN0ZXJQcm92aWRlcnMoYXBwLmdldElEKCkpO1xyXG5cdFx0YXdhaXQgdGhpcy5vdXRib3VuZENvbW11bmljYXRpb25Qcm92aWRlck1hbmFnZXIudW5yZWdpc3RlclByb3ZpZGVycyhhcHAuZ2V0SUQoKSwge1xyXG5cdFx0XHRrZWVwUmVmZXJlbmNlczogb3B0cy5rZWVwT3V0Ym91bmRDb21tdW5pY2F0aW9uUHJvdmlkZXJzLFxyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHQvKipcclxuXHQgKiBEZXRlcm1pbmVzIGlmIHRoZSBBcHAncyByZXF1aXJlZCBzZXR0aW5ncyBhcmUgc2V0IG9yIG5vdC5cclxuXHQgKiBTaG91bGQgYSBwYWNrYWdlVmFsdWUgYmUgcHJvdmlkZWQgYW5kIG5vdCBlbXB0eSwgdGhlbiBpdCdzIGNvbnNpZGVyZWQgc2V0LlxyXG5cdCAqL1xyXG5cdHByaXZhdGUgYXJlUmVxdWlyZWRTZXR0aW5nc1NldChzdG9yYWdlSXRlbTogSUFwcFN0b3JhZ2VJdGVtKTogYm9vbGVhbiB7XHJcblx0XHRsZXQgcmVzdWx0ID0gdHJ1ZTtcclxuXHJcblx0XHRmb3IgKGNvbnN0IHNldGsgb2YgT2JqZWN0LmtleXMoc3RvcmFnZUl0ZW0uc2V0dGluZ3MpKSB7XHJcblx0XHRcdGNvbnN0IHNldHQgPSBzdG9yYWdlSXRlbS5zZXR0aW5nc1tzZXRrXTtcclxuXHRcdFx0Ly8gSWYgaXQncyBub3QgcmVxdWlyZWQsIGlnbm9yZVxyXG5cdFx0XHRpZiAoIXNldHQucmVxdWlyZWQpIHtcclxuXHRcdFx0XHRjb250aW51ZTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgKHNldHQudmFsdWUgIT09ICd1bmRlZmluZWQnIHx8IHNldHQucGFja2FnZVZhbHVlICE9PSAndW5kZWZpbmVkJykge1xyXG5cdFx0XHRcdGNvbnRpbnVlO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXN1bHQgPSBmYWxzZTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gcmVzdWx0O1xyXG5cdH1cclxuXHJcblx0cHJpdmF0ZSBhc3luYyBlbmFibGVBcHAoYXBwOiBQcm94aWVkQXBwLCBzaWxlbmNlU3RhdHVzID0gZmFsc2UpOiBQcm9taXNlPGJvb2xlYW4+IHtcclxuXHRcdGxldCBlbmFibGU6IGJvb2xlYW47XHJcblx0XHRsZXQgc3RhdHVzID0gQXBwU3RhdHVzLkVSUk9SX0RJU0FCTEVEO1xyXG5cclxuXHRcdHRyeSB7XHJcblx0XHRcdGF3YWl0IGFwcC52YWxpZGF0ZUxpY2Vuc2UoKTtcclxuXHRcdFx0YXdhaXQgYXBwLnZhbGlkYXRlSW5zdGFsbGF0aW9uKCk7XHJcblxyXG5cdFx0XHRlbmFibGUgPSAoYXdhaXQgYXBwLmNhbGwoQXBwTWV0aG9kLk9ORU5BQkxFKSkgYXMgYm9vbGVhbjtcclxuXHJcblx0XHRcdGlmIChlbmFibGUpIHtcclxuXHRcdFx0XHRzdGF0dXMgPSBBcHBTdGF0dXMuTUFOVUFMTFlfRU5BQkxFRDtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRzdGF0dXMgPSBBcHBTdGF0dXMuRElTQUJMRUQ7XHJcblx0XHRcdFx0Y29uc29sZS53YXJuKGBUaGUgQXBwICgke2FwcC5nZXRJRCgpfSkgZGlzYWJsZWQgaXRzZWxmIHdoZW4gYmVpbmcgZW5hYmxlZC4gXFxuQ2hlY2sgdGhlIFwib25FbmFibGVcIiBpbXBsZW1lbnRhdGlvbiBmb3IgZGV0YWlscy5gKTtcclxuXHRcdFx0fVxyXG5cdFx0fSBjYXRjaCAoZSkge1xyXG5cdFx0XHRlbmFibGUgPSBmYWxzZTtcclxuXHJcblx0XHRcdGlmIChlIGluc3RhbmNlb2YgSW52YWxpZExpY2Vuc2VFcnJvcikge1xyXG5cdFx0XHRcdHN0YXR1cyA9IEFwcFN0YXR1cy5JTlZBTElEX0xJQ0VOU0VfRElTQUJMRUQ7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmIChlIGluc3RhbmNlb2YgSW52YWxpZEluc3RhbGxhdGlvbkVycm9yKSB7XHJcblx0XHRcdFx0c3RhdHVzID0gQXBwU3RhdHVzLklOVkFMSURfSU5TVEFMTEFUSU9OX0RJU0FCTEVEO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRjb25zb2xlLmVycm9yKGUpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChlbmFibGUpIHtcclxuXHRcdFx0dGhpcy5leHRlcm5hbENvbXBvbmVudE1hbmFnZXIucmVnaXN0ZXJFeHRlcm5hbENvbXBvbmVudHMoYXBwLmdldElEKCkpO1xyXG5cdFx0XHRhd2FpdCB0aGlzLmFwaU1hbmFnZXIucmVnaXN0ZXJBcGlzKGFwcC5nZXRJRCgpKTtcclxuXHRcdFx0dGhpcy5saXN0ZW5lck1hbmFnZXIucmVnaXN0ZXJMaXN0ZW5lcnMoYXBwKTtcclxuXHRcdFx0dGhpcy5saXN0ZW5lck1hbmFnZXIucmVsZWFzZUVzc2VudGlhbEV2ZW50cyhhcHApO1xyXG5cdFx0XHR0aGlzLnZpZGVvQ29uZlByb3ZpZGVyTWFuYWdlci5yZWdpc3RlclByb3ZpZGVycyhhcHAuZ2V0SUQoKSk7XHJcblx0XHRcdGF3YWl0IHRoaXMub3V0Ym91bmRDb21tdW5pY2F0aW9uUHJvdmlkZXJNYW5hZ2VyLnJlZ2lzdGVyUHJvdmlkZXJzKGFwcC5nZXRJRCgpKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGF3YWl0IHRoaXMucHVyZ2VBcHBDb25maWcoYXBwLCB7XHJcblx0XHRcdFx0a2VlcFNjaGVkdWxlZEpvYnM6IHRydWUsXHJcblx0XHRcdFx0a2VlcFNsYXNoY29tbWFuZHM6IHRydWUsXHJcblx0XHRcdFx0a2VlcE91dGJvdW5kQ29tbXVuaWNhdGlvblByb3ZpZGVyczogdHJ1ZSxcclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblxyXG5cdFx0YXdhaXQgYXBwLnNldFN0YXR1cyhzdGF0dXMsIHNpbGVuY2VTdGF0dXMpO1xyXG5cclxuXHRcdHJldHVybiBlbmFibGU7XHJcblx0fVxyXG5cclxuXHRwcml2YXRlIGFzeW5jIGNyZWF0ZUFwcFVzZXIoYXBwSW5mbzogSUFwcEluZm8pOiBQcm9taXNlPHN0cmluZz4ge1xyXG5cdFx0Y29uc3QgYXBwVXNlciA9IGF3YWl0ICh0aGlzLmJyaWRnZXMuZ2V0VXNlckJyaWRnZSgpIGFzIElJbnRlcm5hbFVzZXJCcmlkZ2UgJiBVc2VyQnJpZGdlKS5nZXRBcHBVc2VyKGFwcEluZm8uaWQpO1xyXG5cclxuXHRcdGlmIChhcHBVc2VyKSB7XHJcblx0XHRcdHJldHVybiBhcHBVc2VyLmlkO1xyXG5cdFx0fVxyXG5cclxuXHRcdGNvbnN0IHVzZXJEYXRhOiBQYXJ0aWFsPElVc2VyPiA9IHtcclxuXHRcdFx0dXNlcm5hbWU6IGAke2FwcEluZm8ubmFtZVNsdWd9LmJvdGAsXHJcblx0XHRcdG5hbWU6IGFwcEluZm8ubmFtZSxcclxuXHRcdFx0cm9sZXM6IFsnYXBwJ10sXHJcblx0XHRcdGFwcElkOiBhcHBJbmZvLmlkLFxyXG5cdFx0XHR0eXBlOiBVc2VyVHlwZS5BUFAsXHJcblx0XHRcdHN0YXR1czogJ29ubGluZScsXHJcblx0XHRcdGlzRW5hYmxlZDogdHJ1ZSxcclxuXHRcdH07XHJcblxyXG5cdFx0cmV0dXJuICh0aGlzLmJyaWRnZXMuZ2V0VXNlckJyaWRnZSgpIGFzIElJbnRlcm5hbFVzZXJCcmlkZ2UgJiBVc2VyQnJpZGdlKS5jcmVhdGUodXNlckRhdGEsIGFwcEluZm8uaWQsIHtcclxuXHRcdFx0YXZhdGFyVXJsOiBhcHBJbmZvLmljb25GaWxlQ29udGVudCB8fCBhcHBJbmZvLmljb25GaWxlLFxyXG5cdFx0XHRqb2luRGVmYXVsdENoYW5uZWxzOiB0cnVlLFxyXG5cdFx0XHRzZW5kV2VsY29tZUVtYWlsOiBmYWxzZSxcclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0cHJpdmF0ZSBhc3luYyByZW1vdmVBcHBVc2VyKGFwcDogUHJveGllZEFwcCk6IFByb21pc2U8Ym9vbGVhbj4ge1xyXG5cdFx0Y29uc3QgYXBwVXNlciA9IGF3YWl0ICh0aGlzLmJyaWRnZXMuZ2V0VXNlckJyaWRnZSgpIGFzIElJbnRlcm5hbFVzZXJCcmlkZ2UgJiBVc2VyQnJpZGdlKS5nZXRBcHBVc2VyKGFwcC5nZXRJRCgpKTtcclxuXHJcblx0XHRpZiAoIWFwcFVzZXIpIHtcclxuXHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuICh0aGlzLmJyaWRnZXMuZ2V0VXNlckJyaWRnZSgpIGFzIElJbnRlcm5hbFVzZXJCcmlkZ2UgJiBVc2VyQnJpZGdlKS5yZW1vdmUoYXBwVXNlciwgYXBwLmdldElEKCkpO1xyXG5cdH1cclxuXHJcblx0cHJpdmF0ZSBhc3luYyB1bmluc3RhbGxBcHAoYXBwOiBQcm94aWVkQXBwLCB1c2VyOiBJVXNlcik6IFByb21pc2U8Ym9vbGVhbj4ge1xyXG5cdFx0bGV0IHJlc3VsdDogYm9vbGVhbjtcclxuXHRcdGNvbnN0IGNvbnRleHQgPSB7IHVzZXIgfTtcclxuXHJcblx0XHR0cnkge1xyXG5cdFx0XHRhd2FpdCBhcHAuY2FsbChBcHBNZXRob2QuT05VTklOU1RBTEwsIGNvbnRleHQpO1xyXG5cclxuXHRcdFx0cmVzdWx0ID0gdHJ1ZTtcclxuXHRcdH0gY2F0Y2ggKGUpIHtcclxuXHRcdFx0Y29uc3Qgc3RhdHVzID0gQXBwU3RhdHVzLkVSUk9SX0RJU0FCTEVEO1xyXG5cclxuXHRcdFx0cmVzdWx0ID0gZmFsc2U7XHJcblxyXG5cdFx0XHRhd2FpdCBhcHAuc2V0U3RhdHVzKHN0YXR1cyk7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHJlc3VsdDtcclxuXHR9XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBnZXRQZXJtaXNzaW9uc0J5QXBwSWQgPSAoYXBwSWQ6IHN0cmluZykgPT4ge1xyXG5cdGlmICghQXBwTWFuYWdlci5JbnN0YW5jZSkge1xyXG5cdFx0Y29uc29sZS5lcnJvcignQXBwTWFuYWdlciBzaG91bGQgYmUgaW5zdGFudGlhdGVkIGZpcnN0Jyk7XHJcblx0XHRyZXR1cm4gW107XHJcblx0fVxyXG5cdHJldHVybiBBcHBNYW5hZ2VyLkluc3RhbmNlLmdldFBlcm1pc3Npb25zQnlJZChhcHBJZCk7XHJcbn07XHJcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxTQUFTLE1BQU0sUUFBUSxTQUFTO0FBR2hDLFNBQVMsVUFBVSxRQUFRLGVBQWU7QUFFMUMsU0FBUyxVQUFVLFFBQVEsWUFBWTtBQUN2QyxTQUFTLFNBQVMsRUFBRSxjQUFjLFFBQVEsMEJBQTBCO0FBRXBFLFNBQVMsU0FBUyxRQUFRLHlCQUF5QjtBQUduRCxTQUFTLFFBQVEsUUFBUSxzQkFBc0I7QUFHL0MsU0FBUyxXQUFXLEVBQUUseUJBQXlCLEVBQUUsZ0JBQWdCLFFBQVEsYUFBYTtBQUN0RixTQUFTLG1CQUFtQixRQUFRLFdBQVc7QUFDL0MsU0FBUyx3QkFBd0IsUUFBUSxvQ0FBb0M7QUFDN0UsU0FDQyxrQkFBa0IsRUFDbEIsYUFBYSxFQUNiLDJCQUEyQixFQUMzQixpQkFBaUIsRUFDakIsa0JBQWtC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
// denoCacheMetadata=14665895535681300507,125801675793434070