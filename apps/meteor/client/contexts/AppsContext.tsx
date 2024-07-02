import type { AppClientManager } from '@rocket.chat/apps-engine/client/AppClientManager';
import type { IPermission } from '@rocket.chat/apps-engine/definition/permissions/IPermission';
import type { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import type { Serialized } from '@rocket.chat/core-typings';
import { createContext } from 'react';

import type { IAppExternalURL, ICategory } from '../apps/@types/IOrchestrator';
import type { AsyncState } from '../lib/asyncState';
import { AsyncStatePhase } from '../lib/asyncState';
import type { App } from '../views/marketplace/types';

export interface IAppsOrchestrator {
	load(): Promise<void>;
	getAppClientManager(): AppClientManager;
	handleError(error: unknown): void;
	getInstalledApps(): Promise<App[]>;
	getAppsFromMarketplace(isAdminUser?: boolean): Promise<App[]>;
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

export type AppsContextValue = {
	installedApps: Omit<AsyncState<{ apps: App[] }>, 'error'>;
	marketplaceApps: Omit<AsyncState<{ apps: App[] }>, 'error'>;
	privateApps: Omit<AsyncState<{ apps: App[] }>, 'error'>;
	reload: () => Promise<void>;
	orchestrator?: IAppsOrchestrator;
};

export const AppsContext = createContext<AppsContextValue>({
	installedApps: {
		phase: AsyncStatePhase.LOADING,
		value: undefined,
	},
	marketplaceApps: {
		phase: AsyncStatePhase.LOADING,
		value: undefined,
	},
	privateApps: {
		phase: AsyncStatePhase.LOADING,
		value: undefined,
	},
	reload: () => Promise.resolve(),
	orchestrator: undefined,
});
