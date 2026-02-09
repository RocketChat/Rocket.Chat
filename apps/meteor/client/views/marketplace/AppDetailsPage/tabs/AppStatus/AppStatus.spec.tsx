import { faker } from '@faker-js/faker';
import type { AppPermission } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AppStatus from './AppStatus';
import { mockedAppsContext } from '../../../../../../tests/mocks/client/marketplace';
import { createFakeApp, createFakeLicenseInfo } from '../../../../../../tests/mocks/data';
import type { Actions } from '../../../helpers';
import { handleAPIError } from '../../../helpers/handleAPIError';
import { useAppInstallationHandler } from '../../../hooks/useAppInstallationHandler';
import { useMarketplaceActions } from '../../../hooks/useMarketplaceActions';

jest.mock('../../../hooks/useMarketplaceActions');
jest.mock('../../../hooks/useAppInstallationHandler');
jest.mock('../../../helpers/handleAPIError');

describe('AppStatus', () => {
	const mockInstall = jest.fn();
	const mockUpdate = jest.fn();
	const mockPurchase = jest.fn();
	const mockAppInstallationHandler = jest.fn();
	const mockedUseAppInstallationHandler = jest.mocked(useAppInstallationHandler);
	const mockedUseMarketplaceActions = jest.mocked(useMarketplaceActions);
	const mockedHandleAPIError = jest.mocked(handleAPIError);

	const defaultAppCountResponse = {
		maxMarketplaceApps: 10,
		installedApps: 0,
		maxPrivateApps: 0,
		totalMarketplaceEnabled: 0,
		totalPrivateEnabled: 0,
		hasUnlimitedApps: true,
		enabled: true,
		limit: 10,
	};

	const createWrapper = (appCountOverrides = {}, withAdminPermission = true) => {
		const builder = mockAppRoot()
			.withJohnDoe()
			.withEndpoint('GET', '/apps/count', async () => ({
				...defaultAppCountResponse,
				...appCountOverrides,
			}))
			.withEndpoint('GET', '/v1/licenses.info', async () => ({
				license: createFakeLicenseInfo(),
			}))
			.wrap(mockedAppsContext);
		return withAdminPermission ? builder.withPermission('manage-apps').build() : builder.build();
	};

	beforeEach(() => {
		jest.clearAllMocks();
		mockedUseMarketplaceActions.mockReturnValue({
			install: mockInstall,
			update: mockUpdate,
			purchase: mockPurchase,
		});
		mockedUseAppInstallationHandler.mockReturnValue(mockAppInstallationHandler);
		mockedHandleAPIError.mockClear();
	});

	it('should look good', async () => {
		const app = createFakeApp();

		render(<AppStatus app={app} showStatus isAppDetailsPage />, {
			wrapper: createWrapper(
				{
					maxMarketplaceApps: faker.number.int({ min: 0 }),
					installedApps: faker.number.int({ min: 0 }),
					maxPrivateApps: faker.number.int({ min: 0 }),
					totalMarketplaceEnabled: faker.number.int({ min: 0 }),
					totalPrivateEnabled: faker.number.int({ min: 0 }),
				},
				false,
			),
		});

		expect(screen.getByRole('button', { name: 'Request' })).toBeInTheDocument();
	});

	it('should reset loading state when install action throws an error', async () => {
		expect.assertions(3);
		const app = createFakeApp({
			installed: false,
			isPurchased: false,
			price: 0,
			purchaseType: 'buy',
			versionIncompatible: false,
		});
		const installError = new Error('install failed');
		mockInstall.mockRejectedValue(installError);

		let onSuccessCallback: (action: Actions | '', appPermissions?: AppPermission[]) => void;
		mockedUseAppInstallationHandler.mockImplementation(({ onSuccess }) => {
			onSuccessCallback = onSuccess;
			return mockAppInstallationHandler;
		});

		render(<AppStatus app={app} showStatus isAppDetailsPage />, {
			wrapper: createWrapper(),
		});

		const button = screen.getByRole('button', { name: 'Install' });
		await userEvent.click(button);
		await act(async () => {
			onSuccessCallback('install');
		});
		await waitFor(() => {
			expect(button).not.toBeDisabled();
		});
		expect(mockInstall).toHaveBeenCalled();
		expect(handleAPIError).toHaveBeenCalledWith(installError);
	});

	it('should reset loading state when update action throws an error', async () => {
		expect.assertions(3);
		const app = createFakeApp({
			installed: true,
			version: '1.0.0',
			marketplaceVersion: '2.0.0',
		});
		const updateError = new Error('update failed');
		mockUpdate.mockRejectedValue(updateError);

		let onSuccessCallback: (action: Actions | '', appPermissions?: AppPermission[]) => void;
		mockedUseAppInstallationHandler.mockImplementation(({ onSuccess }) => {
			onSuccessCallback = onSuccess;
			return mockAppInstallationHandler;
		});

		render(<AppStatus app={app} showStatus isAppDetailsPage installed />, {
			wrapper: createWrapper({ installedApps: 1, totalMarketplaceEnabled: 1 }),
		});

		const button = screen.getByRole('button', { name: 'Update' });
		await userEvent.click(button);
		await act(async () => {
			onSuccessCallback('update');
		});
		await waitFor(() => {
			expect(button).not.toBeDisabled();
		});
		expect(mockUpdate).toHaveBeenCalled();
		expect(handleAPIError).toHaveBeenCalledWith(updateError);
	});

	it('should reset loading state when purchase action throws an error', async () => {
		expect.assertions(3);
		const app = createFakeApp({
			installed: false,
			isPurchased: false,
			price: 10,
			purchaseType: 'buy',
		});
		const purchaseError = new Error('purchase failed');
		mockPurchase.mockRejectedValue(purchaseError);

		let onSuccessCallback: (action: Actions | '', appPermissions?: AppPermission[]) => void;
		mockedUseAppInstallationHandler.mockImplementation(({ onSuccess }) => {
			onSuccessCallback = onSuccess;
			return mockAppInstallationHandler;
		});

		render(<AppStatus app={app} showStatus isAppDetailsPage />, {
			wrapper: createWrapper(),
		});

		const button = screen.getByRole('button', { name: 'Buy' });
		await userEvent.click(button);
		await act(async () => {
			onSuccessCallback('purchase');
		});
		await waitFor(() => {
			expect(button).not.toBeDisabled();
		});
		expect(mockPurchase).toHaveBeenCalled();
		expect(handleAPIError).toHaveBeenCalledWith(purchaseError);
	});
});
