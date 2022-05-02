/* eslint-disable @typescript-eslint/no-var-requires */
import { AppClientManager } from '@rocket.chat/apps-engine/client/AppClientManager';
import { IApiEndpointMetadata } from '@rocket.chat/apps-engine/definition/api';
import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import { IApp } from '@rocket.chat/apps-engine/definition/IApp';
import { IPermission } from '@rocket.chat/apps-engine/definition/permissions/IPermission';
import { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import { IAppStorageItem } from '@rocket.chat/apps-engine/server/storage/IAppStorageItem';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { dispatchToastMessage } from '../../../client/lib/toast';
import { settings } from '../../settings/client';
import { CachedCollectionManager } from '../../ui-cached-collection';
import { AppWebsocketReceiver } from './communication';
import { handleI18nResources } from './i18n';
import { RealAppsEngineUIHost } from './RealAppsEngineUIHost';

const { APIClient } = require('../../utils');
const { hasAtLeastOnePermission } = require('../../authorization');

class AppClientOrchestrator {
	private _appClientUIHost: RealAppsEngineUIHost;

	private _manager: AppClientManager;

	private isLoaded: boolean;

	private deferredIsEnabled: boolean;

	private enable: boolean;

	private ws: AppWebsocketReceiver;

	constructor() {
		this._appClientUIHost = new RealAppsEngineUIHost();
		this._manager = new AppClientManager(this._appClientUIHost);
		this.isLoaded = false;
	}

	private get isEnable(): boolean {
		return this.enable;
	}

	private set isEnable(value: boolean) {
		this.isEnable = value;
	}

	public async load(isEnabled: boolean): Promise<void> {
		if (!this.isLoaded) {
			this.ws = new AppWebsocketReceiver();
			this.isLoaded = true;
		}

		await handleI18nResources();
		this.isEnable = isEnabled;
	}

	public getWsListener(): AppWebsocketReceiver {
		return this.ws;
	}

	public getAppClientManager(): AppClientManager {
		return this._manager;
	}

	public handleError(error: Error): void {
		console.error(error);
		if (hasAtLeastOnePermission(['manage-apps'])) {
			dispatchToastMessage({
				type: 'error',
				message: error.message,
			});
		}
	}

	public isEnabled(): boolean {
		return this.deferredIsEnabled;
	}

	public async getApps(): Promise<IApp[]> {
		const { apps } = await APIClient.get('apps');
		return apps;
	}

	public async getAppsFromMarketplace(): Promise<IApp[]> {
		const appsOverviews: any = await APIClient.get('apps', { marketplace: 'true' });
		return appsOverviews.map(({ latest, price, pricingPlans, purchaseType, isEnterpriseOnly, modifiedAt }: any) => ({
			...latest,
			price,
			pricingPlans,
			purchaseType,
			isEnterpriseOnly,
			modifiedAt,
		}));
	}

	public async getAppsOnBundle(bundleId: string): Promise<IApp[]> {
		const { apps } = await APIClient.get(`apps/bundles/${bundleId}/apps`);
		return apps;
	}

	public async getAppsLanguages(): Promise<any> {
		const { apps } = await APIClient.get('apps/languages');
		return apps;
	}

	public async getApp(appId: string): Promise<IApp> {
		const { app } = await APIClient.get(`apps/${appId}`);
		return app;
	}

	public async getAppFromMarketplace(appId: string, version: string): Promise<IApp> {
		const { app } = await APIClient.get(`apps/${appId}`, {
			marketplace: 'true',
			version,
		});
		return app;
	}

	public async getLatestAppFromMarketplace(appId: string, version: string): Promise<IApp> {
		const { app } = await APIClient.get(`apps/${appId}`, {
			marketplace: 'true',
			update: 'true',
			appVersion: version,
		});
		return app;
	}

	public async getAppSettings(appId: string): Promise<{ [id: string]: ISetting }> {
		const { settings } = await APIClient.get(`apps/${appId}/settings`);
		return settings;
	}

	public async setAppSettings(appId: string, settings: { [id: string]: ISetting }): Promise<IAppStorageItem> {
		const { updated } = await APIClient.post(`apps/${appId}/settings`, undefined, { settings });
		return updated;
	}

	public async getAppApis(appId: string): Promise<IApiEndpointMetadata[]> {
		const { apis } = await APIClient.get(`apps/${appId}/apis`);
		return apis;
	}

	public async getAppLanguages(appId: string): Promise<IAppStorageItem['languageContent']> {
		const { languages } = await APIClient.get(`apps/${appId}/languages`);
		return languages;
	}

	public async installApp(appId: string, version: string, permissionsGranted: IPermission[]): Promise<IApp> {
		const { app } = await APIClient.post('apps/', {
			appId,
			marketplace: true,
			version,
			permissionsGranted,
		});
		return app;
	}

	public async updateApp(appId: string, version: string, permissionsGranted: IPermission[]): Promise<IApp> {
		const { app } = await APIClient.post(`apps/${appId}`, {
			appId,
			marketplace: true,
			version,
			permissionsGranted,
		});
		return app;
	}

	public uninstallApp(appId: string): any {
		return APIClient.delete(`apps/${appId}`);
	}

	public syncApp(appId: string): any {
		return APIClient.post(`apps/${appId}/sync`);
	}

	public async setAppStatus(appId: string, status: AppStatus): Promise<any> {
		const { status: effectiveStatus } = await APIClient.post(`apps/${appId}/status`, { status });
		return effectiveStatus;
	}

	public enableApp(appId: string): Promise<any> {
		return this.setAppStatus(appId, AppStatus.MANUALLY_ENABLED);
	}

	public disableApp(appId: string): Promise<any> {
		return this.setAppStatus(appId, AppStatus.MANUALLY_ENABLED);
	}

	public buildExternalUrl(appId: string, purchaseType = 'buy', details = false): any {
		return APIClient.get('apps', {
			buildExternalUrl: 'true',
			appId,
			purchaseType,
			details,
		});
	}

	public async getCategories(): Promise<any> {
		const categories = await APIClient.get('apps', { categories: 'true' });
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
