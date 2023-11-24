import { AppClientManager } from '@rocket.chat/apps-engine/client/AppClientManager';
import type { IPermission } from '@rocket.chat/apps-engine/definition/permissions/IPermission';
import type { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import type { Serialized } from '@rocket.chat/core-typings';

import { hasAtLeastOnePermission } from '../../../app/authorization/client';
import { sdk } from '../../../app/utils/client/lib/SDKClient';
import { dispatchToastMessage } from '../../../client/lib/toast';
import type { App } from '../../../client/views/marketplace/types';
import type { IAppExternalURL, ICategory } from './@types/IOrchestrator';
import { RealAppsEngineUIHost } from './RealAppsEngineUIHost';

class AppClientOrchestrator {
	private _appClientUIHost: RealAppsEngineUIHost;

	private _manager: AppClientManager;

	private _isLoaded: boolean;

	constructor() {
		this._appClientUIHost = new RealAppsEngineUIHost();
		this._manager = new AppClientManager(this._appClientUIHost);
		this._isLoaded = false;
	}

	public async load(): Promise<void> {
		if (!this._isLoaded) {
			this._isLoaded = true;
		}
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

	public async getApp(appId: string): Promise<App> {
		const { app } = await sdk.rest.get(`/apps/${appId}` as any);
		return app;
	}

	public async setAppSettings(appId: string, settings: ISetting[]): Promise<void> {
		await sdk.rest.post(`/apps/${appId}/settings`, { settings });
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

	public async getCategories(): Promise<Serialized<ICategory[]>> {
		const result = await sdk.rest.get('/apps/categories');

		if (Array.isArray(result)) {
			// TODO: chapter day: multiple results are returned, but we only need one
			return result as Serialized<ICategory>[];
		}
		throw new Error('Failed to get categories');
	}
}

export const AppClientOrchestratorInstance = new AppClientOrchestrator();
