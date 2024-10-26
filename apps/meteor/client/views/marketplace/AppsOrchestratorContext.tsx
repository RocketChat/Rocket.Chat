import type { AppClientManager } from '@rocket.chat/apps-engine/client/AppClientManager';
import type { IPermission } from '@rocket.chat/apps-engine/definition/permissions/IPermission';
import type { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import type { Serialized } from '@rocket.chat/core-typings';
import { createContext } from 'react';

import type { IAppExternalURL, ICategory } from '../../apps/@types/IOrchestrator';
import type { App } from './types';

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

export const AppsOrchestratorContext = createContext<IAppsOrchestrator>({
	load: () => Promise.resolve(),
	getAppClientManager: () => {
		throw new Error('not implemented');
	},
	handleError: () => undefined,
	getInstalledApps: async () => [],
	getAppsFromMarketplace: async () => ({ apps: [] }),
	getAppsOnBundle: async () => [],
	getApp: () => Promise.reject(new Error('not implemented')),
	setAppSettings: async () => undefined,
	installApp: () => Promise.reject(new Error('not implemented')),
	updateApp: () => Promise.reject(new Error('not implemented')),
	buildExternalUrl: () => Promise.reject(new Error('not implemented')),
	buildExternalAppRequest: () => Promise.reject(new Error('not implemented')),
	buildIncompatibleExternalUrl: () => Promise.reject(new Error('not implemented')),
	getCategories: () => Promise.reject(new Error('not implemented')),
});
