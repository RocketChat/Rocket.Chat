import { AppClientManager } from '@rocket.chat/apps-engine/client/AppClientManager';
import type { IApiEndpointMetadata } from '@rocket.chat/apps-engine/definition/api';
import type { IPermission } from '@rocket.chat/apps-engine/definition/permissions/IPermission';
import type { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import type { IAppStorageItem } from '@rocket.chat/apps-engine/server/storage/IAppStorageItem';
import type { AppScreenshot, AppRequestFilter, Serialized, AppRequestsStats, PaginatedAppRequests } from '@rocket.chat/core-typings';

import { hasAtLeastOnePermission } from '../../../app/authorization/client';
import { sdk } from '../../../app/utils/client/lib/SDKClient';
import { dispatchToastMessage } from '../../../client/lib/toast';
import type { App } from '../../../client/views/marketplace/types';
import type { IAppLanguage, IAppExternalURL, ICategory } from './@types/IOrchestrator';
import { RealAppsEngineUIHost } from './RealAppsEngineUIHost';
import { AppWebsocketReceiver } from './communication';
import { handleI18nResources } from './i18n';

class AppClientOrchestrator {
	private _appClientUIHost: RealAppsEngineUIHost;

	private _manager: AppClientManager;

	private _isLoaded: boolean;

	private _ws: AppWebsocketReceiver;

	constructor() {
		this._appClientUIHost = new RealAppsEngineUIHost();
		this._manager = new AppClientManager(this._appClientUIHost);
		this._isLoaded = false;
	}

	public async load(): Promise<void> {
		if (!this._isLoaded) {
			this._ws = new AppWebsocketReceiver();
			this._isLoaded = true;
		}

		await handleI18nResources();
	}

	public getWsListener(): AppWebsocketReceiver {
		return this._ws;
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
		const { screenshots } = await sdk.rest.get(`/apps/${appId}/screenshots`);
		return screenshots;
	}

	public async getInstalledApps(): Promise<App[]> {
		const result = await sdk.rest.get<'/apps/installed'>('/apps/installed');

		if ('apps' in result) {
			// TODO: chapter day: multiple results are returned, but we only need one
			return result.apps as App[];
		}
		throw new Error('Invalid response from API');
	}

	public async getAppsFromMarketplace(isAdminUser?: boolean): Promise<App[]> {
		const result = await sdk.rest.get('/apps/marketplace', { isAdminUser: isAdminUser ? isAdminUser.toString() : 'false' });

		if (!Array.isArray(result)) {
			// TODO: chapter day: multiple results are returned, but we only need one
			throw new Error('Invalid response from API');
		}

		return (result as App[]).map((app: App) => {
			const { latest, appRequestStats, price, pricingPlans, purchaseType, isEnterpriseOnly, modifiedAt, bundledIn, requestedEndUser } = app;
			return {
				...latest,
				appRequestStats,
				price,
				pricingPlans,
				purchaseType,
				isEnterpriseOnly,
				modifiedAt,
				bundledIn,
				requestedEndUser,
			};
		});
	}

	public async getAppsOnBundle(bundleId: string): Promise<App[]> {
		const { apps } = await sdk.rest.get(`/apps/bundles/${bundleId}/apps`);
		return apps;
	}

	public async getAppsLanguages(): Promise<IAppLanguage> {
		const { apps } = await sdk.rest.get('/apps/languages');
		return apps;
	}

	public async getApp(appId: string): Promise<App> {
		const { app } = await sdk.rest.get(`/apps/${appId}` as any);
		return app;
	}

	public async getAppFromMarketplace(appId: string, version: string): Promise<{ app: App; success: boolean }> {
		const result = await sdk.rest.get(
			`/apps/${appId}` as any,
			{
				marketplace: 'true',
				version,
			} as any,
		);
		return result;
	}

	public async getLatestAppFromMarketplace(appId: string, version: string): Promise<App> {
		const { app } = await sdk.rest.get(
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
		await sdk.rest.post(`/apps/${appId}/settings`, { settings });
	}

	public async getAppApis(appId: string): Promise<IApiEndpointMetadata[]> {
		const { apis } = await sdk.rest.get(`/apps/${appId}/apis`);
		return apis;
	}

	public async getAppLanguages(appId: string): Promise<IAppStorageItem['languageContent']> {
		const { languages } = await sdk.rest.get(`/apps/${appId}/languages`);
		return languages;
	}

	public async installApp(appId: string, version: string, permissionsGranted?: IPermission[]): Promise<App> {
		const { app } = await sdk.rest.post<'/apps/'>('/apps/', {
			appId,
			marketplace: true,
			version,
			permissionsGranted,
		});
		return app;
	}

	public async updateApp(appId: string, version: string, permissionsGranted?: IPermission[]): Promise<App> {
		const result = await sdk.rest.post<'/apps/:id'>(`/apps/${appId}`, {
			appId,
			marketplace: true,
			version,
			permissionsGranted,
		});

		if ('app' in result) {
			return result.app;
		}
		throw new Error('App not found');
	}

	public async buildExternalUrl(appId: string, purchaseType: 'buy' | 'subscription' = 'buy', details = false): Promise<IAppExternalURL> {
		const result = await sdk.rest.get('/apps/buildExternalUrl', {
			appId,
			purchaseType,
			details: `${details}`,
		});

		if ('url' in result) {
			return result;
		}

		throw new Error('Failed to build external url');
	}

	public async buildExternalAppRequest(appId: string) {
		const result = await sdk.rest.get('/apps/buildExternalAppRequest', {
			appId,
		});

		if ('url' in result) {
			return result;
		}
		throw new Error('Failed to build App Request external url');
	}

	public async buildIncompatibleExternalUrl(appId: string, appVersion: string, action: string): Promise<IAppExternalURL> {
		const result = await sdk.rest.get('/apps/incompatibleModal', {
			appId,
			appVersion,
			action,
		});

		if ('url' in result) {
			return result;
		}

		throw new Error('Failed to build external url');
	}

	public async appRequests(
		appId: string,
		filter?: AppRequestFilter,
		sort?: string,
		limit?: number,
		offset?: number,
	): Promise<PaginatedAppRequests> {
		try {
			const response = await sdk.rest.get(`/apps/app-request?appId=${appId}&q=${filter}&sort=${sort}&limit=${limit}&offset=${offset}`);

			return response;
		} catch (e: unknown) {
			throw new Error('Could not get the list of app requests');
		}
	}

	public async getAppRequestsStats(): Promise<AppRequestsStats> {
		try {
			const response = await sdk.rest.get('/apps/app-request/stats');

			return response;
		} catch (e: unknown) {
			throw new Error('Could not get the app requests stats');
		}
	}

	public async getCategories(): Promise<Serialized<ICategory[]>> {
		const result = await sdk.rest.get('/apps/categories');

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

export const AppClientOrchestratorInstance = new AppClientOrchestrator();
