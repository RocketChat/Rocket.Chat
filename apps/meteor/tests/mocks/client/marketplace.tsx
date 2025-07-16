import { faker } from '@faker-js/faker';
import { AppClientManager } from '@rocket.chat/apps-engine/client/AppClientManager';
import { AppsEngineUIHost } from '@rocket.chat/apps-engine/client/AppsEngineUIHost';
import type { IExternalComponentRoomInfo } from '@rocket.chat/apps-engine/client/definition';
import type { ReactNode } from 'react';

import { AppsContext, type IAppsOrchestrator } from '../../../client/contexts/AppsContext';
import { AsyncStatePhase } from '../../../client/lib/asyncState';
import { createFakeApp, createFakeExternalComponentRoomInfo, createFakeExternalComponentUserInfo } from '../data';

class MockedAppsEngineUIHost extends AppsEngineUIHost {
	public async getClientRoomInfo(): Promise<IExternalComponentRoomInfo> {
		return createFakeExternalComponentRoomInfo();
	}

	public async getClientUserInfo() {
		return createFakeExternalComponentUserInfo();
	}
}

class MockedAppClientManager extends AppClientManager {}

export const mockAppsOrchestrator = () => {
	const appsEngineUIHost = new MockedAppsEngineUIHost();
	const manager = new MockedAppClientManager(appsEngineUIHost);

	const orchestrator: IAppsOrchestrator = {
		load: () => Promise.resolve(),
		getAppClientManager: () => manager,
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
	};

	return orchestrator;
};

export const mockedAppsContext = (children: ReactNode) => (
	<AppsContext.Provider
		value={{
			installedApps: {
				phase: AsyncStatePhase.RESOLVED,
				value: { apps: faker.helpers.multiple(createFakeApp) },
			},
			marketplaceApps: {
				phase: AsyncStatePhase.RESOLVED,
				value: { apps: faker.helpers.multiple(createFakeApp) },
			},
			privateApps: {
				phase: AsyncStatePhase.RESOLVED,
				value: { apps: faker.helpers.multiple(createFakeApp) },
			},
			reload: () => Promise.resolve(),
			orchestrator: mockAppsOrchestrator(),
			privateAppsEnabled: false,
		}}
	>
		{children}
	</AppsContext.Provider>
);
