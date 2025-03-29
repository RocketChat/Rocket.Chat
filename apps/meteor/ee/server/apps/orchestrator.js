import { registerOrchestrator } from '@rocket.chat/apps';
import { EssentialAppDisabledException } from '@rocket.chat/apps-engine/definition/exceptions';
import { AppManager } from '@rocket.chat/apps-engine/server/AppManager';
import { Logger } from '@rocket.chat/logger';
import { AppLogs, Apps as AppsModel, AppsPersistence, Statistics } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { AppServerNotifier, AppsRestApi, AppUIKitInteractionApi } from './communication';
import { AppRealLogStorage, AppRealStorage, ConfigurableAppSourceStorage } from './storage';
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
	AppContactsConverter,
} from '../../../app/apps/server/converters';
import { AppThreadsConverter } from '../../../app/apps/server/converters/threads';
import { settings } from '../../../app/settings/server';
import { canEnableApp } from '../../app/license/server/canEnableApp';

function isTesting() {
	return process.env.TEST_MODE === 'true';
}

const DISABLED_PRIVATE_APP_INSTALLATION = ['yes', 'true'].includes(String(process.env.DISABLE_PRIVATE_APP_INSTALLATION).toLowerCase());

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
		this._statisticsModel = Statistics;
		this._storage = new AppRealStorage(this._model);
		this._logStorage = new AppRealLogStorage(this._logModel);
		this._appSourceStorage = new ConfigurableAppSourceStorage(
			settings.get('Apps_Framework_Source_Package_Storage_Type'),
			settings.get('Apps_Framework_Source_Package_Storage_FileSystem_Path'),
		);

		this._converters = new Map();
		this._converters.set('messages', new AppMessagesConverter(this));
		this._converters.set('rooms', new AppRoomsConverter(this));
		this._converters.set('settings', new AppSettingsConverter(this));
		this._converters.set('users', new AppUsersConverter(this));
		this._converters.set('visitors', new AppVisitorsConverter(this));
		this._converters.set('contacts', new AppContactsConverter(this));
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

	getStatisticsModel() {
		return this._statisticsModel;
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

		// This needs to happen sequentially to keep track of app limits
		for await (const app of apps) {
			try {
				await canEnableApp(app.getStorageItem());

				await this.getManager().loadOne(app.getID(), true);
			} catch (error) {
				this._rocketchatLogger.warn(`App "${app.getInfo().name}" could not be enabled: `, error.message);
			}
		}

		await this.getBridges().getSchedulerBridge().startScheduler();

		const appCount = (await this.getManager().get({ enabled: true })).length;

		this._rocketchatLogger.info(`Loaded the Apps Framework and loaded a total of ${appCount} Apps!`);
	}

	async migratePrivateApps() {
		const apps = await this.getManager().get({ installationSource: 'private' });

		await Promise.all(apps.map((app) => this.getManager().migrate(app.getID())));
		await Promise.all(apps.map((app) => this.getNotifier().appUpdated(app.getID())));
	}

	async findMajorVersionUpgradeDate(targetVersion = 7) {
		let upgradeToV7Date = null;
		let hadPreTargetVersion = false;

		try {
			const statistics = await this.getStatisticsModel().findInstallationDates();
			if (!statistics || statistics.length === 0) {
				this._rocketchatLogger.info('No statistics found');
				return upgradeToV7Date;
			}

			const statsAscendingByInstallDate = statistics.sort((a, b) => new Date(a.installedAt) - new Date(b.installedAt));
			for (const stat of statsAscendingByInstallDate) {
				const version = stat.version || '';

				if (!version) {
					continue;
				}

				const majorVersion = parseInt(version.split('.')[0], 10);
				if (isNaN(majorVersion)) {
					continue;
				}

				if (majorVersion < targetVersion) {
					hadPreTargetVersion = true;
				}

				if (hadPreTargetVersion && majorVersion >= targetVersion) {
					upgradeToV7Date = new Date(stat.installedAt);
					this._rocketchatLogger.info(`Found upgrade to v${targetVersion} date: ${upgradeToV7Date.toISOString()}`);
					break;
				}
			}
		} catch (error) {
			this._rocketchatLogger.error('Error checking statistics for version history:', error.message);
		}

		return upgradeToV7Date;
	}

	async disableMarketplaceApps() {
		return this.disableApps('marketplace', false, 5);
	}

	async disablePrivateApps() {
		return this.disableApps('private', true, 0);
	}

	async disableApps(installationSource, grandfatherApps, maxApps) {
		const upgradeToV7Date = await this.findMajorVersionUpgradeDate();
		const apps = await this.getManager().get({ installationSource });

		const grandfathered = [];
		const toKeep = [];
		const toDisable = [];

		for (const app of apps) {
			const storageItem = app.getStorageItem();
			const isEnabled = ['enabled', 'manually_enabled', 'auto_enabled'].includes(storageItem.status);
			const marketplaceInfo = storageItem.marketplaceInfo && storageItem.marketplaceInfo[0];

			const wasInstalledBeforeV7 = upgradeToV7Date && storageItem.createdAt && new Date(storageItem.createdAt) < upgradeToV7Date;

			if (wasInstalledBeforeV7 && isEnabled && grandfatherApps) {
				grandfathered.push(app);
				continue;
			}

			if (marketplaceInfo?.isEnterpriseOnly === true && installationSource === 'marketplace') {
				toDisable.push(app);
				continue;
			}

			if (isEnabled) {
				toKeep.push(app);
			}
		}

		toKeep.sort((a, b) => new Date(a.getStorageItem().createdAt || 0) - new Date(b.getStorageItem().createdAt || 0));

		if (toKeep.length > maxApps) {
			toDisable.push(...toKeep.splice(maxApps));
		}

		if (toDisable.length === 0) {
			return;
		}

		const disablePromises = toDisable.map((app) => {
			const appId = app.getID();
			return this.getManager().disable(appId);
		});

		try {
			await Promise.all(disablePromises);
			this._rocketchatLogger.info(
				`${installationSource} apps processing complete - kept ${grandfathered.length + toKeep.length}, disabled ${toDisable.length}`,
			);
		} catch (error) {
			this._rocketchatLogger.error('Error disabling apps:', error.message);
		}
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

export const Apps = new AppServerOrchestrator();
registerOrchestrator(Apps);
