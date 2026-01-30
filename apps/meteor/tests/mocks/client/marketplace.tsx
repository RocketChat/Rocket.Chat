import { AppClientManager } from '@rocket.chat/apps-engine/client/AppClientManager';
import { AppsEngineUIHost } from '@rocket.chat/apps-engine/client/AppsEngineUIHost';
import type { IExternalComponentRoomInfo } from '@rocket.chat/apps-engine/client/definition';
import type { ReactNode } from 'react';

import { AppsContext, type IAppsOrchestrator } from '../../../client/contexts/AppsContext';
import { createFakeExternalComponentRoomInfo, createFakeExternalComponentUserInfo } from '../data';

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
	<AppsContext.Provider value={mockAppsOrchestrator()}>{children}</AppsContext.Provider>
);
