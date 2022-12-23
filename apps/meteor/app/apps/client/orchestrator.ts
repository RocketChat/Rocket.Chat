/* eslint-disable @typescript-eslint/no-var-requires */
import type { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import { AppClientManager } from '@rocket.chat/apps-engine/client/AppClientManager';
import type { IApiEndpointMetadata } from '@rocket.chat/apps-engine/definition/api';
import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { IPermission } from '@rocket.chat/apps-engine/definition/permissions/IPermission';
import type { IAppStorageItem } from '@rocket.chat/apps-engine/server/storage/IAppStorageItem';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import type { AppScreenshot, Serialized } from '@rocket.chat/core-typings';

import type { App } from '../../../client/views/admin/apps/types';
import { dispatchToastMessage } from '../../../client/lib/toast';
import { settings } from '../../settings/client';
import { CachedCollectionManager } from '../../ui-cached-collection';
import { createDeferredValue } from '../lib/misc/DeferredValue';
import type {
	// IAppFromMarketplace,
	IAppLanguage,
	IAppExternalURL,
	ICategory,
	// IAppSynced,
	// IAppScreenshots,
	// IScreenshot,
} from './@types/IOrchestrator';
import { AppWebsocketReceiver } from './communication';
import { handleI18nResources } from './i18n';
import { RealAppsEngineUIHost } from './RealAppsEngineUIHost';
import { APIClient } from '../../utils/client';
import { hasAtLeastOnePermission } from '../../authorization/client';

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

	public handleError(error: unknown): void {
		if (hasAtLeastOnePermission(['manage-apps'])) {
			dispatchToastMessage({
				type: 'error',
				message: error,
			});
		}
	}

	public async screenshots(appId: string): Promise<AppScreenshot[]> {
		const { screenshots } = await APIClient.get(`/apps/${appId}/screenshots`);
		return screenshots;
	}

	public isEnabled(): Promise<boolean> | undefined {
		return this.deferredIsEnabled;
	}

	public async getApps(): Promise<App[]> {
		const result = await APIClient.get<'/apps'>('/apps');

		if ('apps' in result) {
			// TODO: chapter day: multiple results are returned, but we only need one
			return result.apps as App[];
		}
		throw new Error('Invalid response from API');
	}

	public async getAppsFromMarketplace(): Promise<App[]> {
		const result = await APIClient.get('/apps', { marketplace: 'true' });

		if (!Array.isArray(result)) {
			// TODO: chapter day: multiple results are returned, but we only need one
			throw new Error('Invalid response from API');
		}

		return (result as App[]).map((app: App) => {
			const { latest, price, pricingPlans, purchaseType, isEnterpriseOnly, modifiedAt, bundledIn } = app;
			return {
				...latest,
				price,
				pricingPlans,
				purchaseType,
				isEnterpriseOnly,
				modifiedAt,
				bundledIn,
			};
		});
	}

	public async getAppsOnBundle(bundleId: string): Promise<App[]> {
		const { apps } = await APIClient.get(`/apps/bundles/${bundleId}/apps`);
		return apps;
	}

	public async getAppsLanguages(): Promise<IAppLanguage> {
		const { apps } = await APIClient.get('/apps/languages');
		return apps;
	}

	public async getApp(appId: string): Promise<App> {
		const { app } = await APIClient.get(`/apps/${appId}` as any);
		return app;
	}

	public async getAppFromMarketplace(appId: string, version: string): Promise<{ app: App; success: boolean }> {
		const result = await APIClient.get(
			`/apps/${appId}` as any,
			{
				marketplace: 'true',
				version,
			} as any,
		);
		return result;
	}

	public async getLatestAppFromMarketplace(appId: string, version: string): Promise<App> {
		const { app } = await APIClient.get(
			`/apps/${appId}` as any,
			{
				marketplace: 'true',
				update: 'true',
				appVersion: version,
			} as any,
		);
		return app;
	}

	public async setAppSettings(appId: string, settings: ISetting[]): Promise<void> {
		await APIClient.post(`/apps/${appId}/settings`, { settings });
	}

	public async getAppApis(appId: string): Promise<IApiEndpointMetadata[]> {
		const { apis } = await APIClient.get(`/apps/${appId}/apis`);
		return apis;
	}

	public async getAppLanguages(appId: string): Promise<IAppStorageItem['languageContent']> {
		const { languages } = await APIClient.get(`/apps/${appId}/languages`);
		return languages;
	}

	public async installApp(appId: string, version: string, permissionsGranted: IPermission[]): Promise<App> {
		const { app } = await APIClient.post('/apps', {
			appId,
			marketplace: true,
			version,
			permissionsGranted,
		});
		return app;
	}

	public async updateApp(appId: string, version: string, permissionsGranted: IPermission[]): Promise<App> {
		const result = (await (APIClient.post as any)(`/apps/${appId}` as any, {
			appId,
			marketplace: true,
			version,
			permissionsGranted,
		})) as any;

		if ('app' in result) {
			return result;
		}
		throw new Error('App not found');
	}

	public async setAppStatus(appId: string, status: AppStatus): Promise<string> {
		const { status: effectiveStatus } = await APIClient.post(`/apps/${appId}/status`, { status });
		return effectiveStatus;
	}

	public disableApp(appId: string): Promise<string> {
		return this.setAppStatus(appId, AppStatus.MANUALLY_ENABLED);
	}

	public async buildExternalUrl(appId: string, purchaseType: 'buy' | 'subscription' = 'buy', details = false): Promise<IAppExternalURL> {
		const result = await APIClient.get('/apps', {
			buildExternalUrl: 'true',
			appId,
			purchaseType,
			details: `${details}`,
		});

		if ('url' in result) {
			return result;
		}

		throw new Error('Failed to build external url');
	}

	public async buildIncompatibleExternalUrl(appId: string, appVersion: string, action: string): Promise<IAppExternalURL> {
		const result = await APIClient.get('/apps/incompatibleModal', {
			appId,
			appVersion,
			action,
		});

		if ('url' in result) {
			return result;
		}

		throw new Error('Failed to build external url');
	}

	public async getCategories(): Promise<Serialized<ICategory[]>> {
		const result = await APIClient.get('/apps', { categories: 'true' });

		if (Array.isArray(result)) {
			// TODO: chapter day: multiple results are returned, but we only need one
			return result as Serialized<ICategory>[];
		}
		throw new Error('Failed to get categories');
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
		const isEnabled = settings.get('/Apps_Framework_enabled');
		Apps.load(isEnabled);
	});
});
