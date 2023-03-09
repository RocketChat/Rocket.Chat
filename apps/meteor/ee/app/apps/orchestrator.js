import EventEmitter from 'events';

import { EssentialAppDisabledException } from '@rocket.chat/apps-engine/definition/exceptions';
import { AppInterface } from '@rocket.chat/apps-engine/definition/metadata';
import { AppManager } from '@rocket.chat/apps-engine/server/AppManager';
import { Apps as AppsModel, AppsLogs as AppsLogsModel, AppsPersistence as AppsPersistenceModel } from '@rocket.chat/models';
import { MeteorError } from '@rocket.chat/core-services';

import { Logger } from '../../../server/lib/logger/Logger';
<<<<<<<< HEAD:apps/meteor/ee/app/apps/orchestrator.js
import { RealAppBridges } from './bridges';
========
import { AppsLogsModel, AppsModel, AppsPersistenceModel } from '../../../app/models/server';
import { settings, settingsRegistry } from '../../../app/settings/server';
import { RealAppBridges } from '../../../app/apps/server/bridges';
import { AppServerNotifier, AppsRestApi, AppUIKitInteractionApi } from './communication';
>>>>>>>> develop:apps/meteor/ee/server/apps/orchestrator.js
import {
	AppMessagesConverter,
	AppRoomsConverter,
	AppSettingsConverter,
	AppUsersConverter,
	AppVideoConferencesConverter,
	AppDepartmentsConverter,
	AppUploadsConverter,
	AppVisitorsConverter,
} from '../../../app/apps/server/converters';
import { AppRealLogsStorage, AppRealStorage, ConfigurableAppSourceStorage } from './storage';
import { canEnableApp } from '../../app/license/server/license';

function isTesting() {
	return process.env.TEST_MODE === 'true';
}

export class AppServerOrchestrator {
	constructor(db) {
		this.db = db;
		this._isInitialized = false;
		this.appEventsSink = new EventEmitter();
	}

	initialize({ marketplaceUrl = 'https://marketplace.rocket.chat', appsSourceStorageType, appsSourceStorageFilesystemPath }) {
		if (this._isInitialized) {
			return;
		}

		this._rocketchatLogger = new Logger('Rocket.Chat Apps');

		this.developmentMode = false;
		this.frameworkEnabled = true;

<<<<<<<< HEAD:apps/meteor/ee/app/apps/orchestrator.js
		this._marketplaceUrl = marketplaceUrl;

		this._model = AppsModel;
		this._logModel = AppsLogsModel;
		this._persistModel = AppsPersistenceModel;
========
		this._model = AppsModel;
		this._logModel = new AppsLogsModel();
		this._persistModel = new AppsPersistenceModel();
>>>>>>>> develop:apps/meteor/ee/server/apps/orchestrator.js
		this._storage = new AppRealStorage(this._model);
		this._logStorage = new AppRealLogsStorage(this._logModel);
		this._appSourceStorage = new ConfigurableAppSourceStorage(appsSourceStorageType, appsSourceStorageFilesystemPath, this.db);

		this._converters = new Map();
		this._converters.set('messages', new AppMessagesConverter(this));
		this._converters.set('rooms', new AppRoomsConverter(this));
		this._converters.set('settings', new AppSettingsConverter(this));
		this._converters.set('users', new AppUsersConverter(this));
		this._converters.set('visitors', new AppVisitorsConverter(this));
		this._converters.set('departments', new AppDepartmentsConverter(this));
		this._converters.set('uploads', new AppUploadsConverter(this));
		this._converters.set('videoConferences', new AppVideoConferencesConverter());

		this._bridges = new RealAppBridges(this);

		this._manager = new AppManager({
			metadataStorage: this._storage,
			logStorage: this._logStorage,
			bridges: this._bridges,
			sourceStorage: this._appSourceStorage,
		});

<<<<<<<< HEAD:apps/meteor/ee/app/apps/orchestrator.js
========
		this._communicators = new Map();
		this._communicators.set('notifier', new AppServerNotifier(this));
		this._communicators.set('restapi', new AppsRestApi(this, this._manager));
		this._communicators.set('uikit', new AppUIKitInteractionApi(this));

>>>>>>>> develop:apps/meteor/ee/server/apps/orchestrator.js
		this._isInitialized = true;
	}

	getModel() {
		return this._model;
	}

	/**
	 * @returns {AppsPersistenceModel}
	 */
	getPersistenceModel() {
		return this._persistModel;
	}

	getStorage() {
		return this._storage;
	}

	getLogStorage() {
		return this._logStorage;
	}

	getConverters() {
		return this._converters;
	}

	getBridges() {
		return this._bridges;
	}

	notifyAppEvent(event, ...payload) {
		this.appEventsSink.emit(event, ...payload);
	}

	getManager() {
		return this._manager;
	}

	getProvidedComponents() {
		return this._manager.getExternalComponentManager().getProvidedComponents();
	}

	getAppSourceStorage() {
		return this._appSourceStorage;
	}

	isInitialized() {
		return this._isInitialized;
	}

<<<<<<<< HEAD:apps/meteor/ee/app/apps/orchestrator.js
	isEnabled() {
		return this.frameworkEnabled;
	}

========
>>>>>>>> develop:apps/meteor/ee/server/apps/orchestrator.js
	isLoaded() {
		return this.getManager().areAppsLoaded();
	}

	isDebugging() {
<<<<<<<< HEAD:apps/meteor/ee/app/apps/orchestrator.js
		return this.developmentMode && !isTesting();
========
		return !isTesting();
>>>>>>>> develop:apps/meteor/ee/server/apps/orchestrator.js
	}

	/**
	 * @returns {Logger}
	 */
	getRocketChatLogger() {
		return this._rocketchatLogger;
	}

	debugLog(...args) {
		if (this.isDebugging()) {
			this.getRocketChatLogger().debug(...args);
		}
	}

	getMarketplaceUrl() {
		return this._marketplaceUrl;
	}

	async load() {
		// Don't try to load it again if it has
		// already been loaded
		if (this.isLoaded()) {
			return;
		}

		await this.getManager().load();

		// Before enabling each app we verify if there is still room for it
		await this.getManager()
			.get()
			// We reduce everything to a promise chain so it runs sequentially
			.reduce(
				(control, app) =>
					control.then(async () => {
						const canEnable = await canEnableApp(app.getStorageItem());

						if (canEnable) {
							return this.getManager().loadOne(app.getID());
						}

						this._rocketchatLogger.warn(`App "${app.getInfo().name}" can't be enabled due to CE limits.`);
					}),
				Promise.resolve(),
			);

		await this.getBridges().getSchedulerBridge().startScheduler();

		this._rocketchatLogger.info(`Loaded the Apps Framework and loaded a total of ${this.getManager().get({ enabled: true }).length} Apps!`);
	}

	async unload() {
		// Don't try to unload it if it's already been
		// unlaoded or wasn't unloaded to start with
		if (!this.isLoaded()) {
			return;
		}

		return this._manager
			.unload()
			.then(() => this._rocketchatLogger.info('Unloaded the Apps Framework.'))
			.catch((err) => this._rocketchatLogger.error({ msg: 'Failed to unload the Apps Framework!', err }));
	}

	async updateAppsMarketplaceInfo(apps = []) {
		if (!this.isLoaded()) {
			return;
		}

		return this._manager.updateAppsMarketplaceInfo(apps).then(() => this._manager.get());
	}

	async installedApps(filter = {}) {
		if (!this.isLoaded()) {
			return;
		}

		return this._manager.get(filter);
	}

	async triggerEvent(event, ...payload) {
		if (!this.isLoaded()) {
			return;
		}

		return this.getBridges()
			.getListenerBridge()
			.handleEvent(event, ...payload)
			.catch((error) => {
				if (error instanceof EssentialAppDisabledException) {
					throw new MeteorError('error-app-essential-disabled');
				}

				throw error;
			});
	}

	setDevelopmentMode(isEnabled) {
		this.developmentMode = isEnabled;
	}

	setFrameworkEnabled(isEnabled) {
		this.frameworkEnabled = isEnabled;
	}
}

export const AppEvents = AppInterface;
<<<<<<<< HEAD:apps/meteor/ee/app/apps/orchestrator.js
========
export const Apps = new AppServerOrchestrator();

settingsRegistry.addGroup('General', function () {
	this.section('Apps', function () {
		this.add('Apps_Logs_TTL', '30_days', {
			type: 'select',
			values: [
				{
					key: '7_days',
					i18nLabel: 'Apps_Logs_TTL_7days',
				},
				{
					key: '14_days',
					i18nLabel: 'Apps_Logs_TTL_14days',
				},
				{
					key: '30_days',
					i18nLabel: 'Apps_Logs_TTL_30days',
				},
			],
			public: true,
			hidden: false,
			alert: 'Apps_Logs_TTL_Alert',
		});

		this.add('Apps_Framework_Source_Package_Storage_Type', 'gridfs', {
			type: 'select',
			values: [
				{
					key: 'gridfs',
					i18nLabel: 'GridFS',
				},
				{
					key: 'filesystem',
					i18nLabel: 'FileSystem',
				},
			],
			public: true,
			hidden: false,
			alert: 'Apps_Framework_Source_Package_Storage_Type_Alert',
		});

		this.add('Apps_Framework_Source_Package_Storage_FileSystem_Path', '', {
			type: 'string',
			public: true,
			enableQuery: {
				_id: 'Apps_Framework_Source_Package_Storage_Type',
				value: 'filesystem',
			},
			alert: 'Apps_Framework_Source_Package_Storage_FileSystem_Alert',
		});
	});
});

settings.watch('Apps_Framework_Source_Package_Storage_Type', (value) => {
	if (!Apps.isInitialized()) {
		appsSourceStorageType = value;
	} else {
		Apps.getAppSourceStorage().setStorage(value);
	}
});

settings.watch('Apps_Framework_Source_Package_Storage_FileSystem_Path', (value) => {
	if (!Apps.isInitialized()) {
		appsSourceStorageFilesystemPath = value;
	} else {
		Apps.getAppSourceStorage().setFileSystemStoragePath(value);
	}
});

settings.watch('Apps_Logs_TTL', (value) => {
	if (!Apps.isInitialized()) {
		return;
	}

	let expireAfterSeconds = 0;

	switch (value) {
		case '7_days':
			expireAfterSeconds = 604800;
			break;
		case '14_days':
			expireAfterSeconds = 1209600;
			break;
		case '30_days':
			expireAfterSeconds = 2592000;
			break;
	}

	if (!expireAfterSeconds) {
		return;
	}

	const model = Apps._logModel;

	model.resetTTLIndex(expireAfterSeconds);
});
>>>>>>>> develop:apps/meteor/ee/server/apps/orchestrator.js
