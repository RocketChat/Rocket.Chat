import { EssentialAppDisabledException } from '@rocket.chat/apps-engine/definition/exceptions';
import { AppInterface } from '@rocket.chat/apps-engine/definition/metadata';
import { AppManager } from '@rocket.chat/apps-engine/server/AppManager';
import { Logger } from '@rocket.chat/logger';
import { AppLogs, Apps as AppsModel, AppsPersistence } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { RealAppBridges } from '../../../app/apps/server/bridges';
import {
	AppMessagesConverter,
	AppRoomsConverter,
	AppSettingsConverter,
	AppUsersConverter,
	AppVideoConferencesConverter,
	AppDepartmentsConverter,
	AppUploadsConverter,
	AppVisitorsConverter,
	AppRolesConverter,
} from '../../../app/apps/server/converters';
import { AppThreadsConverter } from '../../../app/apps/server/converters/threads';
import { settings } from '../../../app/settings/server';
import { canEnableApp } from '../../app/license/server/canEnableApp';
import { AppServerNotifier, AppsRestApi, AppUIKitInteractionApi } from './communication';
import { AppRealLogStorage, AppRealStorage, ConfigurableAppSourceStorage } from './storage';

function isTesting() {
	return process.env.TEST_MODE === 'true';
}

const DISABLED_PRIVATE_APP_INSTALLATION = ['yes', 'true'].includes(String(process.env.DISABLE_PRIVATE_APP_INSTALLATION).toLowerCase());

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

		this._model = AppsModel;
		this._logModel = AppLogs;
		this._persistModel = AppsPersistence;
		this._storage = new AppRealStorage(this._model);
		this._logStorage = new AppRealLogStorage(this._logModel);
		this._appSourceStorage = new ConfigurableAppSourceStorage(appsSourceStorageType, appsSourceStorageFilesystemPath);

		this._converters = new Map();
		this._converters.set('messages', new AppMessagesConverter(this));
		this._converters.set('rooms', new AppRoomsConverter(this));
		this._converters.set('settings', new AppSettingsConverter(this));
		this._converters.set('users', new AppUsersConverter(this));
		this._converters.set('visitors', new AppVisitorsConverter(this));
		this._converters.set('departments', new AppDepartmentsConverter(this));
		this._converters.set('uploads', new AppUploadsConverter(this));
		this._converters.set('videoConferences', new AppVideoConferencesConverter());
		this._converters.set('threads', new AppThreadsConverter(this));
		this._converters.set('roles', new AppRolesConverter(this));

		this._bridges = new RealAppBridges(this);

		this._manager = new AppManager({
			metadataStorage: this._storage,
			logStorage: this._logStorage,
			bridges: this._bridges,
			sourceStorage: this._appSourceStorage,
		});

		this._communicators = new Map();
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

	isLoaded() {
		return this.getManager().areAppsLoaded();
	}

	isDebugging() {
		return !isTesting();
	}

	shouldDisablePrivateAppInstallation() {
		return DISABLED_PRIVATE_APP_INSTALLATION;
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
		const apps = await this.getManager().get();

		/* eslint-disable no-await-in-loop */
		// This needs to happen sequentially to keep track of app limits
		for (const app of apps) {
			const canEnable = await canEnableApp(app.getStorageItem());

			if (!canEnable) {
				this._rocketchatLogger.warn(`App "${app.getInfo().name}" can't be enabled due to CE limits.`);
				// We need to continue as the limits are applied depending on the app installation source
				// i.e. if one limit is hit, we can't break the loop as the following apps might still be valid
				continue;
			}

			await this.getManager().loadOne(app.getID());
		}
		/* eslint-enable no-await-in-loop */

		await this.getBridges().getSchedulerBridge().startScheduler();

		const appCount = (await this.getManager().get({ enabled: true })).length;

		this._rocketchatLogger.info(`Loaded the Apps Framework and loaded a total of ${appCount} Apps!`);
	}

	async disableApps() {
		const apps = await this.getManager().get();

		await Promise.all(apps.map((app) => this.getManager().disable(app.getID())));
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
					throw new Meteor.Error('error-essential-app-disabled');
				}

				throw error;
			});
	}
}

export const AppEvents = AppInterface;
export const Apps = new AppServerOrchestrator();

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
