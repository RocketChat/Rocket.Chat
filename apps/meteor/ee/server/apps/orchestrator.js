import EventEmitter from 'events';

import { EssentialAppDisabledException } from '@rocket.chat/apps-engine/definition/exceptions';
import { AppInterface } from '@rocket.chat/apps-engine/definition/metadata';
import { AppManager } from '@rocket.chat/apps-engine/server/AppManager';
import { Apps as AppsModel, AppsLogs as AppsLogsModel, AppsPersistence as AppsPersistenceModel } from '@rocket.chat/models';
import { MeteorError } from '@rocket.chat/core-services';

import { Logger } from '../../../server/lib/logger/Logger';
import { RealAppBridges } from '../../app/apps/bridges';
import { settings, settingsRegistry } from '../../../app/settings/server';
import { RealAppBridges } from '../../../app/apps/server/bridges';
import { AppServerNotifier, AppsRestApi, AppUIKitInteractionApi } from './communication';
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
import { AppRealLogsStorage, AppRealStorage, ConfigurableAppSourceStorage } from '../../app/apps/storage';
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

		this._marketplaceUrl = marketplaceUrl;

		this._model = AppsModel;
		this._logModel = AppsLogsModel;
		this._persistModel = AppsPersistenceModel;
		this._storage = new AppRealStorage(this._model);
		this._logStorage = new AppRealLogsStorage(this._logModel);
		// TODO: Remove it when fixed the race condition
		// This enforce Fibers for a method not waited on apps-engine preventing a race condition
		const { storeEntries } = this._logStorage;
		this._logStorage.storeEntries = (...args) => Promise.await(storeEntries.call(this._logStorage, ...args));
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

	isLoaded() {
		return this.getManager().areAppsLoaded();
	}

	isDebugging() {
		return !isTesting();
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
}

export const AppEvents = AppInterface;
