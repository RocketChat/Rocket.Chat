import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import type { AppBridges, AppEvents, IAppConvertersMap, IAppServerNotifier, IAppServerOrchestrator } from '@rocket.chat/apps';
import { registerOrchestrator } from '@rocket.chat/apps';
import { AppManager } from '@rocket.chat/apps/dist/server/AppManager';
import type { IGetAppsFilter } from '@rocket.chat/apps/dist/server/IGetAppsFilter';
import type { ProxiedApp } from '@rocket.chat/apps/dist/server/ProxiedApp';
import type { IMarketplaceInfo } from '@rocket.chat/apps/dist/server/marketplace/IMarketplaceInfo';
import { AppInstallationSource } from '@rocket.chat/apps/dist/server/storage/IAppStorageItem';
import { EssentialAppDisabledException } from '@rocket.chat/apps-engine/definition/exceptions';
import type { IExternalComponent } from '@rocket.chat/apps-engine/definition/externalComponent';
import { Logger } from '@rocket.chat/logger';
import { AppLogs, Apps as AppsModel, AppsPersistence, Statistics } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { AppServerNotifier, AppsRestApi, AppUIKitInteractionApi } from './communication';
import { redactionFieldPaths } from './lib/redactor';
import { MarketplaceAPIClient } from './marketplace/MarketplaceAPIClient';
import { isTesting } from './marketplace/isTesting';
import { AppRealLogStorage, AppRealStorage, ConfigurableAppSourceStorage } from './storage';
import { RealAppBridges } from '../../../app/apps/server/bridges';
import type { HandleEvent } from '../../../app/apps/server/bridges/listeners';
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
import { settings } from '../../../server/settings';
import { canEnableApp } from '../lib/license/canEnableApp';

const DISABLED_PRIVATE_APP_INSTALLATION = ['yes', 'true'].includes(String(process.env.DISABLE_PRIVATE_APP_INSTALLATION).toLowerCase());

type AppCommunicators = {
	notifier: AppServerNotifier;
	restapi: AppsRestApi;
	uikit: AppUIKitInteractionApi;
};

interface IAppCommunicatorsMap extends Map<keyof AppCommunicators, AppCommunicators[keyof AppCommunicators]> {
	get<T extends keyof AppCommunicators>(key: T): AppCommunicators[T];
}

export class AppServerOrchestrator implements IAppServerOrchestrator {
	private _isInitialized: boolean;

	private readonly marketplaceClient: MarketplaceAPIClient;

	private _rocketchatLogger: Logger;

	private _model: typeof AppsModel;

	private _logModel: typeof AppLogs;

	private _persistModel: typeof AppsPersistence;

	private _statisticsModel: typeof Statistics;

	private _storage: AppRealStorage;

	private _logStorage: AppRealLogStorage;

	private _appSourceStorage: ConfigurableAppSourceStorage;

	private _converters: IAppConvertersMap;

	private _bridges: RealAppBridges;

	private _manager: AppManager;

	private _communicators: IAppCommunicatorsMap;

	constructor() {
		this._isInitialized = false;

		this.marketplaceClient = new MarketplaceAPIClient();
	}

	initialize(): void {
		if (this._isInitialized) {
			return;
		}

		this._rocketchatLogger = new Logger('Rocket.Chat Apps', { redact: redactionFieldPaths });

		this._model = AppsModel;
		this._logModel = AppLogs;
		this._persistModel = AppsPersistence;
		this._statisticsModel = Statistics;
		this._storage = new AppRealStorage(this._model);
		this._logStorage = new AppRealLogStorage(this._logModel);
		this._appSourceStorage = new ConfigurableAppSourceStorage(
			settings.get<string>('Apps_Framework_Source_Package_Storage_Type'),
			settings.get<string>('Apps_Framework_Source_Package_Storage_FileSystem_Path'),
		);

		this._converters = new Map() as IAppConvertersMap;
		this._converters.set('messages', new AppMessagesConverter(this));
		this._converters.set('rooms', new AppRoomsConverter(this));
		this._converters.set('settings', new AppSettingsConverter(this));
		this._converters.set('users', new AppUsersConverter(this));
		this._converters.set('visitors', new AppVisitorsConverter(this));
		this._converters.set('contacts', new AppContactsConverter());
		this._converters.set('departments', new AppDepartmentsConverter(this));
		this._converters.set('uploads', new AppUploadsConverter(this));
		this._converters.set('videoConferences', new AppVideoConferencesConverter());
		this._converters.set('threads', new AppThreadsConverter(this));
		this._converters.set('roles', new AppRolesConverter());

		this._bridges = new RealAppBridges(this);

		const tempFilePath = path.join(os.tmpdir(), 'apps-engine-temp');

		try {
			// We call this only once at server startup, so using the synchronous version is fine
			fs.mkdirSync(tempFilePath);
		} catch (err) {
			// If the temp directory already exists, we can continue
			if ((err as NodeJS.ErrnoException).code !== 'EEXIST') {
				throw new Error('Failed to initialize the Apps-Engine', { cause: err });
			}
		}

		this._manager = new AppManager({
			metadataStorage: this._storage,
			logStorage: this._logStorage,
			bridges: this.getBridges(),
			sourceStorage: this._appSourceStorage,
			tempFilePath,
		});

		this._communicators = new Map() as IAppCommunicatorsMap;
		this._communicators.set('notifier', new AppServerNotifier(this));
		this._communicators.set('restapi', new AppsRestApi(this, this._manager));
		this._communicators.set('uikit', new AppUIKitInteractionApi(this));

		this._isInitialized = true;
	}

	getMarketplaceClient(): MarketplaceAPIClient {
		return this.marketplaceClient;
	}

	getModel(): typeof AppsModel {
		return this._model;
	}

	getPersistenceModel(): typeof AppsPersistence {
		return this._persistModel;
	}

	getStatisticsModel(): typeof Statistics {
		return this._statisticsModel;
	}

	getStorage(): AppRealStorage {
		return this._storage;
	}

	getLogStorage(): AppRealLogStorage {
		if (!this._logStorage) {
			throw new Error('Apps-Engine not yet fully initialized');
		}

		return this._logStorage;
	}

	getConverters(): IAppConvertersMap {
		return this._converters;
	}

	getBridges(): AppBridges {
		// `RealAppBridges` does extend `AppBridges`, but its listener bridge takes a single event object
		// instead of the positional arguments `IListenerBridge` declares, so the structural check on the
		// bridge collection has to be bypassed. Internal callers use `this._bridges` to keep the real types.
		return this._bridges as unknown as AppBridges;
	}

	getNotifier(): IAppServerNotifier {
		return this._communicators.get('notifier');
	}

	getManager(): AppManager {
		return this._manager;
	}

	getProvidedComponents(): IExternalComponent[] {
		return this._manager.getExternalComponentManager().getProvidedComponents();
	}

	getAppSourceStorage(): ConfigurableAppSourceStorage {
		return this._appSourceStorage;
	}

	isInitialized(): boolean {
		return this._isInitialized;
	}

	isLoaded(): boolean {
		return this.getManager().areAppsLoaded();
	}

	isDebugging(): boolean {
		return !isTesting();
	}

	shouldDisablePrivateAppInstallation(): boolean {
		return DISABLED_PRIVATE_APP_INSTALLATION;
	}

	getRocketChatLogger(): Logger {
		return this._rocketchatLogger;
	}

	debugLog(...args: any[]): void {
		if (this.isDebugging()) {
			// The logger only declares a single message parameter, but callers have always relied on
			// the extra arguments being forwarded to the underlying pino instance.
			this.getRocketChatLogger().debug(...(args as [object | string]));
		}
	}

	async load(): Promise<void> {
		// Don't try to load it again if it has
		// already been loaded
		if (this.isLoaded()) {
			return;
		}

		await this.getManager().load();

		// Before enabling each app we verify if there is still room for it
		const apps = await this.getManager().get();

		// This needs to happen sequentially to keep track of app limits
		for (const app of apps) {
			try {
				await canEnableApp(app.getStorageItem());

				await this.getManager().loadOne(app.getID(), true);
			} catch (error) {
				this._rocketchatLogger.warn({
					msg: 'App could not be enabled',
					appName: app.getInfo().name,
					err: error,
				});
			}
		}

		await this._bridges.getSchedulerBridge().startScheduler();

		const appCount = (await this.getManager().get({ enabled: true })).length;

		this._rocketchatLogger.info({
			msg: 'Loaded the Apps Framework and apps',
			appCount,
		});
	}

	async migratePrivateApps(): Promise<void> {
		const apps = await this.getManager().get({ installationSource: AppInstallationSource.PRIVATE });

		await Promise.all(apps.map((app) => this.getManager().migrate(app.getID())));
		await Promise.all(apps.map((app) => this.getNotifier().appUpdated(app.getID())));
	}

	async findMajorVersionUpgradeDate(targetVersion = 7): Promise<Date | null> {
		let upgradeToV7Date: Date | null = null;
		let hadPreTargetVersion = false;

		try {
			const statistics = await this.getStatisticsModel().findInstallationDates();
			if (!statistics || statistics.length === 0) {
				this._rocketchatLogger.info('No statistics found');
				return upgradeToV7Date;
			}

			const statsAscendingByInstallDate = statistics.sort(
				(a, b) => new Date(a.installedAt ?? NaN).getTime() - new Date(b.installedAt ?? NaN).getTime(),
			);
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
					upgradeToV7Date = new Date(stat.installedAt ?? NaN);
					this._rocketchatLogger.info({
						msg: 'Found upgrade to target version date',
						targetVersion,
						upgradeToDate: upgradeToV7Date.toISOString(),
					});
					break;
				}
			}
		} catch (err) {
			this._rocketchatLogger.error({
				msg: 'Error checking statistics for version history',
				err,
			});
		}

		return upgradeToV7Date;
	}

	async disableMarketplaceApps(): Promise<void> {
		return this.disableApps(AppInstallationSource.MARKETPLACE, false, 5);
	}

	async disablePrivateApps(): Promise<void> {
		return this.disableApps(AppInstallationSource.PRIVATE, true, 0);
	}

	async disableApps(installationSource: AppInstallationSource, grandfatherApps: boolean, maxApps: number): Promise<void> {
		const upgradeToV7Date = await this.findMajorVersionUpgradeDate();
		const apps = await this.getManager().get({ installationSource });

		const grandfathered: ProxiedApp[] = [];
		const toKeep: ProxiedApp[] = [];
		const toDisable: ProxiedApp[] = [];

		for (const app of apps) {
			const storageItem = app.getStorageItem();
			const isEnabled = ['enabled', 'manually_enabled', 'auto_enabled'].includes(storageItem.status);
			const marketplaceInfo = storageItem.marketplaceInfo?.[0];

			const wasInstalledBeforeV7 = upgradeToV7Date && storageItem.createdAt && new Date(storageItem.createdAt) < upgradeToV7Date;

			if (wasInstalledBeforeV7 && isEnabled && grandfatherApps) {
				grandfathered.push(app);
				continue;
			}

			if (marketplaceInfo?.isEnterpriseOnly === true && installationSource === AppInstallationSource.MARKETPLACE) {
				toDisable.push(app);
				continue;
			}

			if (isEnabled) {
				toKeep.push(app);
			}
		}

		toKeep.sort((a, b) => new Date(a.getStorageItem().createdAt || 0).getTime() - new Date(b.getStorageItem().createdAt || 0).getTime());

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
			this._rocketchatLogger.info({
				msg: 'Apps processing complete',
				installationSource,
				keptCount: grandfathered.length + toKeep.length,
				disabledCount: toDisable.length,
			});
		} catch (error) {
			this._rocketchatLogger.error({
				msg: 'Error disabling apps',
				err: error,
			});
		}
	}

	async unload(): Promise<void> {
		// Don't try to unload it if it's already been
		// unlaoded or wasn't unloaded to start with
		if (!this.isLoaded()) {
			return;
		}

		return this._manager
			.unload(false)
			.then(() => this._rocketchatLogger.info('Unloaded the Apps Framework.'))
			.catch((err) =>
				this._rocketchatLogger.error({
					msg: 'Failed to unload the Apps Framework!',
					err,
				}),
			);
	}

	async updateAppsMarketplaceInfo(apps: Array<{ latest: IMarketplaceInfo }> = []): Promise<ProxiedApp[] | undefined> {
		if (!this.isLoaded()) {
			return;
		}

		return this._manager.updateAppsMarketplaceInfo(apps).then(() => this._manager.get());
	}

	async installedApps(filter: IGetAppsFilter = {}): Promise<ProxiedApp[] | undefined> {
		if (!this.isLoaded()) {
			return;
		}

		return this._manager.get(filter);
	}

	async triggerEvent(event: AppEvents, ...payload: any[]): Promise<any> {
		if (!this.isLoaded()) {
			return;
		}

		return this._bridges
			.getListenerBridge()
			.handleEvent({ event, payload } as HandleEvent)
			.catch((error: unknown) => {
				if (error instanceof EssentialAppDisabledException) {
					throw new Meteor.Error('error-essential-app-disabled');
				}

				throw error;
			});
	}
}

export const Apps = new AppServerOrchestrator();
registerOrchestrator(Apps);
