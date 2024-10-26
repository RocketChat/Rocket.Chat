import type { AppClientManager } from '@rocket.chat/apps-engine/client/AppClientManager';
import type { IPermission } from '@rocket.chat/apps-engine/definition/permissions/IPermission';
import type { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import type { Serialized } from '@rocket.chat/core-typings';
import { createContext } from 'react';

import type { IAppExternalURL, ICategory } from '../apps/@types/IOrchestrator';
import type { App } from '../views/marketplace/types';

export interface IAppsOrchestrator {
	load(): Promise<void>;
	getAppClientManager(): AppClientManager;
	handleError(error: unknown): void;
	getInstalledApps(): Promise<App[]>;
	getAppsFromMarketplace(isAdminUser?: boolean): Promise<{ apps: App[]; error?: unknown }>;
	getAppsOnBundle(bundleId: string): Promise<App[]>;
	getApp(appId: string): Promise<App>;
	setAppSettings(appId: string, settings: ISetting[]): Promise<void>;
	installApp(appId: string, version: string, permissionsGranted?: IPermission[]): Promise<App>;
	updateApp(appId: string, version: string, permissionsGranted?: IPermission[]): Promise<App>;
	buildExternalUrl(appId: string, purchaseType?: 'buy' | 'subscription', details?: boolean): Promise<IAppExternalURL>;
	buildExternalAppRequest(appId: string): Promise<{ url: string }>;
	buildIncompatibleExternalUrl(appId: string, appVersion: string, action: string): Promise<IAppExternalURL>;
	getCategories(): Promise<Serialized<ICategory[]>>;
}

export type MarketplaceContextValue = {
	apps:
		| { status: 'loading'; data?: { marketplace: App[]; installed: App[]; private: App[] }; error?: undefined }
		| { status: 'error'; data?: { marketplace: App[]; installed: App[]; private: App[] }; error: unknown }
		| { status: 'success'; data: { marketplace: App[]; installed: App[]; private: App[] }; error?: undefined };
	reload: () => Promise<void>;
	orchestrator?: IAppsOrchestrator;
	privateAppsEnabled: boolean;
};

export const MarketplaceContext = createContext<MarketplaceContextValue>({
	apps: {
		status: 'loading',
		data: undefined,
		error: undefined,
	},
	reload: () => Promise.resolve(),
	orchestrator: undefined,
	privateAppsEnabled: false,
});
