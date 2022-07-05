import { EssentialAppDisabledException } from '@rocket.chat/apps-engine/definition/exceptions';
import { AppInterface } from '@rocket.chat/apps-engine/definition/metadata';
import { AppManager } from '@rocket.chat/apps-engine/server/AppManager';
import { Meteor } from 'meteor/meteor';

import { Logger } from '../../../server/lib/logger/Logger';
import { AppsLogsModel, AppsModel, AppsPersistenceModel } from '../../models/server';
import { settings, settingsRegistry } from '../../settings/server';
import { RealAppBridges } from './bridges';
import { AppMethods, AppServerNotifier, AppsRestApi, AppUIKitInteractionApi } from './communication';
import {
	AppMessagesConverter,
	AppRoomsConverter,
	AppSettingsConverter,
	AppUsersConverter,
	AppVideoConferencesConverter,
} from './converters';
import { AppDepartmentsConverter } from './converters/departments';
import { AppUploadsConverter } from './converters/uploads';
import { AppVisitorsConverter } from './converters/visitors';
import { AppRealLogsStorage, AppRealStorage, ConfigurableAppSourceStorage } from './storage';

function isTesting() {
	return process.env.TEST_MODE === 'true';
}

let appsSourceStorageType;
let appsSourceStorageFilesystemPath;

export class AppServerOrchestrator {
	constructor() {
		this._isInitialized = false;
	}

	initialize() {
		if (this._isInitialized) {
			return;
		}

		this._rocketchatLogger = new Logger('Rocket.Chat Apps');

		if (typeof process.env.OVERWRITE_INTERNAL_MARKETPLACE_URL === 'string' && process.env.OVERWRITE_INTERNAL_MARKETPLACE_URL !== '') {
			this._marketplaceUrl = process.env.OVERWRITE_INTERNAL_MARKETPLACE_URL;
		} else {
			this._marketplaceUrl = 'https://marketplace.rocket.chat';
		}

		this._model = new AppsModel();
		this._logModel = new AppsLogsModel();
		this._persistModel = new AppsPersistenceModel();
		this._storage = new AppRealStorage(this._model);
		this._logStorage = new AppRealLogsStorage(this._logModel);
		this._appSourceStorage = new ConfigurableAppSourceStorage(appsSourceStorageType, appsSourceStorageFilesystemPath);

		this._converters = new Map();
		this._converters.set('messages', new AppMessagesConverter(this));
		this._converters.set('rooms', new AppRoomsConverter(this));
		this._converters.set('settings', new AppSettingsConverter(this));
		this._converters.set('users', new AppUsersConverter(this));
		this._converters.set('visitors', new AppVisitorsConverter(this));
		this._converters.set('departments', new AppDepartmentsConverter(this));
		this._converters.set('uploads', new AppUploadsConverter(this));
		this._converters.set('videoConferences', new AppVideoConferencesConverter(this));

		this._bridges = new RealAppBridges(this);

		this._manager = new AppManager({
			metadataStorage: this._storage,
			logStorage: this._logStorage,
			bridges: this._bridges,
			sourceStorage: this._appSourceStorage,
		});

		this._communicators = new Map();
		this._communicators.set('methods', new AppMethods(this));
		this._communicators.set('notifier', new AppServerNotifier(this));
		this._communicators.set('restapi', new AppsRestApi(this, this._manager));
		this._communicators.set('uikit', new AppUIKitInteractionApi(this));

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

	getNotifier() {
		return this._communicators.get('notifier');
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

	isEnabled() {
		return settings.get('Apps_Framework_enabled');
	}

	isLoaded() {
		return this.getManager().areAppsLoaded();
	}

	isDebugging() {
		return settings.get('Apps_Framework_Development_Mode') && !isTesting();
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

		return this._manager
			.load()
			.then((affs) => console.log(`Loaded the Apps Framework and loaded a total of ${affs.length} Apps!`))
			.catch((err) => console.warn('Failed to load the Apps Framework and Apps!', err))
			.then(() => this.getBridges().getSchedulerBridge().startScheduler());
	}

	async unload() {
		// Don't try to unload it if it's already been
		// unlaoded or wasn't unloaded to start with
		if (!this.isLoaded()) {
			return;
		}

		return this._manager
			.unload()
			.then(() => console.log('Unloaded the Apps Framework.'))
			.catch((err) => console.warn('Failed to unload the Apps Framework!', err));
	}

	async updateAppsMarketplaceInfo(apps = []) {
		if (!this.isLoaded()) {
			return;
		}

		return this._manager.updateAppsMarketplaceInfo(apps).then(() => this._manager.get());
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
					throw new Meteor.Error('error-essential-app-disabled');
				}

				throw error;
			});
	}
}

export const AppEvents = AppInterface;
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

		this.add('Apps_Framework_enabled', true, {
			type: 'boolean',
			hidden: false,
		});

		this.add('Apps_Framework_Development_Mode', false, {
			type: 'boolean',
			enableQuery: {
				_id: 'Apps_Framework_enabled',
				value: true,
			},
			public: true,
			hidden: false,
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

settings.watch('Apps_Framework_enabled', (isEnabled) => {
	// In case this gets called before `Meteor.startup`
	if (!Apps.isInitialized()) {
		return;
	}

	if (isEnabled) {
		Apps.load();
	} else {
		Apps.unload();
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

Meteor.startup(function _appServerOrchestrator() {
	Apps.initialize();

	if (Apps.isEnabled()) {
		Apps.load();
	}
});
