import { faker } from '@faker-js/faker';
import { AppClientManager } from '@rocket.chat/apps-engine/client/AppClientManager';
import { AppsEngineUIHost } from '@rocket.chat/apps-engine/client/AppsEngineUIHost';
import type { IExternalComponentRoomInfo } from '@rocket.chat/apps-engine/client/definition';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';

import {
	createFakeApp,
	createFakeExternalComponentRoomInfo,
	createFakeExternalComponentUserInfo,
	createFakeLicenseInfo,
} from '../../../../../../tests/mocks/data';
import type { IAppsOrchestrator } from '../../../../../contexts/AppsContext';
import { AppsContext } from '../../../../../contexts/AppsContext';
import { AsyncStatePhase } from '../../../../../lib/asyncState';
import AppStatus from './AppStatus';

class MockedAppsEngineUIHost extends AppsEngineUIHost {
	public async getClientRoomInfo(): Promise<IExternalComponentRoomInfo> {
		return createFakeExternalComponentRoomInfo();
	}

	public async getClientUserInfo() {
		return createFakeExternalComponentUserInfo();
	}
}

class MockedAppClientManager extends AppClientManager {}

const mockAppsOrchestrator = () => {
	const appsEngineUIHost = new MockedAppsEngineUIHost();
	const manager = new MockedAppClientManager(appsEngineUIHost);

	const orchestrator: IAppsOrchestrator = {
		load: () => Promise.resolve(),
		getAppClientManager: () => manager,
		handleError: () => undefined,
		getInstalledApps: async () => [],
		getAppsFromMarketplace: async () => [],
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

it('should look good', async () => {
	const app = createFakeApp();

	render(<AppStatus app={app} showStatus isAppDetailsPage />, {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withEndpoint('GET', '/apps/count', async () => ({
				maxMarketplaceApps: faker.number.int({ min: 0 }),
				installedApps: faker.number.int({ min: 0 }),
				maxPrivateApps: faker.number.int({ min: 0 }),
				totalMarketplaceEnabled: faker.number.int({ min: 0 }),
				totalPrivateEnabled: faker.number.int({ min: 0 }),
			}))
			.withEndpoint('GET', '/v1/licenses.info', async () => ({
				license: createFakeLicenseInfo(),
			}))
			.wrap((children) => (
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
					}}
				>
					{children}
				</AppsContext.Provider>
			))
			.build(),
	});

	screen.getByRole('button', { name: 'Request' }).click();
});
