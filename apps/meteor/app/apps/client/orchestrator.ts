/* eslint-disable @typescript-eslint/no-var-requires */
import { AppClientManager } from '@rocket.chat/apps-engine/client/AppClientManager';
import { IApiEndpointMetadata } from '@rocket.chat/apps-engine/definition/api';
import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import { IPermission } from '@rocket.chat/apps-engine/definition/permissions/IPermission';
import { IAppStorageItem } from '@rocket.chat/apps-engine/server/storage/IAppStorageItem';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { App } from '../../../client/views/admin/apps/types';
import { dispatchToastMessage } from '../../../client/lib/toast';
import { settings } from '../../settings/client';
import { CachedCollectionManager } from '../../ui-cached-collection';
import { createDeferredValue } from '../lib/misc/DeferredValue';
import {
	IAppExternalURL,
	ICategory,
	IDeletedInstalledApp,
	IAppSynced,
	ISettingsReturn,
	ISettingsPayload,
	ISettingsSetReturn,
	IAppLanguage,
} from './@types/IOrchestrator';
import { AppWebsocketReceiver } from './communication';
import { handleI18nResources } from './i18n';
import { RealAppsEngineUIHost } from './RealAppsEngineUIHost';

const { APIClient } = require('../../utils');
const { hasAtLeastOnePermission } = require('../../authorization');

class AppClientOrchestrator {
	private _appClientUIHost: RealAppsEngineUIHost;

	private _manager: AppClientManager;

	private isLoaded: boolean;

	private ws: AppWebsocketReceiver;

	private setEnabled: (value: boolean | PromiseLike<boolean>) => void;

	private deferredIsEnabled: Promise<boolean> | undefined;

	constructor() {
		this._appClientUIHost = new RealAppsEngineUIHost();
		this._manager = new AppClientManager(this._appClientUIHost);
		this.isLoaded = false;
		const { promise, resolve } = createDeferredValue<boolean>();
		this.deferredIsEnabled = promise;
		this.setEnabled = resolve;
	}

	public async load(isEnabled: boolean): Promise<void> {
		if (!this.isLoaded) {
			this.ws = new AppWebsocketReceiver();
			this.isLoaded = true;
		}

		await handleI18nResources();

		this.setEnabled(isEnabled);
	}

	public getWsListener(): AppWebsocketReceiver {
		return this.ws;
	}

	public getAppClientManager(): AppClientManager {
		return this._manager;
	}

	public handleError(error: Error): void {
		if (hasAtLeastOnePermission(['manage-apps'])) {
			dispatchToastMessage({
				type: 'error',
				message: error.message,
			});
		}
	}

	public isEnabled(): Promise<boolean> | undefined {
		return this.deferredIsEnabled;
	}

	public async getApps(): Promise<App[]> {
		const { apps } = await APIClient.get('/v1/apps');
		return apps;
	}


	public async getAppsFromMarketplace(): Promise<App[]> {
		const appsOverviews: App[] = await APIClient.get('apps', { marketplace: 'true' });
		return appsOverviews.map((app: App) => {
			const { latest, price, pricingPlans, purchaseType, isEnterpriseOnly, modifiedAt } = app;
			return {
				...latest,
				price,
				pricingPlans,
				purchaseType,
				isEnterpriseOnly,
				modifiedAt,
			};
		});
	}

	public async getAppsOnBundle(bundleId: string): Promise<App[]> {
		const { apps } = await APIClient.get(`/v1/apps/bundles/${bundleId}/apps`);
		return apps;
	}

	public async getAppsLanguages(): Promise<IAppLanguage> {
		const { apps } = await APIClient.get('/v1/apps/languages');
		return apps;
	}

	public async getApp(appId: string): Promise<App> {
		const { app } = await APIClient.get(`/v1/apps/${appId}`);
		return app;
	}

	public async getAppFromMarketplace(appId: string, version: string): Promise<App> {
		const { app } = await APIClient.get(`/v1/apps/${appId}`, {
			marketplace: 'true',
			version,
		});
		return app;
	}

	public async getLatestAppFromMarketplace(appId: string, version: string): Promise<App> {
		const { app } = await APIClient.get(`/v1/apps/${appId}`, {
			marketplace: 'true',
			update: 'true',
			appVersion: version,
		});
		return app;
	}

	public async getAppSettings(appId: string): Promise<ISettingsReturn> {
		const { settings } = await APIClient.get(`/v1/apps/${appId}/settings`);
		return settings;
	}

	public async setAppSettings(appId: string, settings: ISettingsPayload): Promise<ISettingsSetReturn> {
		const { updated } = await APIClient.post(`/v1/apps/${appId}/settings`, undefined, { settings });
		return updated;
	}

	public async getAppApis(appId: string): Promise<IApiEndpointMetadata[]> {
		const { apis } = await APIClient.get(`/v1/apps/${appId}/apis`);
		return apis;
	}

	public async getAppLanguages(appId: string): Promise<IAppStorageItem['languageContent']> {
		const { languages } = await APIClient.get(`/v1/apps/${appId}/languages`);
		return languages;
	}

	public async installApp(appId: string, version: string, permissionsGranted: IPermission[]): Promise<IDeletedInstalledApp> {
		const { app } = await APIClient.post('/v1/apps/', {
			appId,
			marketplace: true,
			version,
			permissionsGranted,
		});
		return app;
	}

	public async updateApp(appId: string, version: string, permissionsGranted: IPermission[]): Promise<App> {
		const { app } = await APIClient.post(`/v1/apps/${appId}`, {
			appId,
			marketplace: true,
			version,
			permissionsGranted,
		});
		return app;
	}

	public uninstallApp(appId: string): IDeletedInstalledApp {
		return APIClient.delete(`apps/${appId}`);
	}

	public syncApp(appId: string): IAppSynced {
		return APIClient.post(`/v1/apps/${appId}/sync`);
	}

	public async setAppStatus(appId: string, status: AppStatus): Promise<string> {
		const { status: effectiveStatus } = await APIClient.post(`/v1/apps/${appId}/status`, { status });
		return effectiveStatus;
	}

	public enableApp(appId: string): Promise<string> {
		return this.setAppStatus(appId, AppStatus.MANUALLY_ENABLED);
	}

	public disableApp(appId: string): Promise<string> {
		return this.setAppStatus(appId, AppStatus.MANUALLY_ENABLED);
	}

	public buildExternalUrl(appId: string, purchaseType = 'buy', details = false): IAppExternalURL {
		return APIClient.get('/v1/apps', {
			buildExternalUrl: 'true',
			appId,
			purchaseType,
			details,
		});
	}

	public async getCategories(): Promise<ICategory[]> {
		const categories = await APIClient.get('/v1/apps', { categories: 'true' });
		return categories;
	}

	public getUIHost(): RealAppsEngineUIHost {
		return this._appClientUIHost;
	}
}

export const Apps = new AppClientOrchestrator();

Meteor.startup(() => {
	CachedCollectionManager.onLogin(() => {
		Meteor.call('apps/is-enabled', (error: Error, isEnabled: boolean) => {
			if (error) {
				Apps.handleError(error);
				return;
			}

			Apps.getAppClientManager().initialize();
			Apps.load(isEnabled);
		});
	});

	Tracker.autorun(() => {
		const isEnabled = settings.get('Apps_Framework_enabled');
		Apps.load(isEnabled);
	});
});
