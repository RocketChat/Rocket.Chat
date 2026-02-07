import { faker } from '@faker-js/faker';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AppStatus from './AppStatus';
import { mockedAppsContext } from '../../../../../../tests/mocks/client/marketplace';
import { createFakeApp, createFakeLicenseInfo } from '../../../../../../tests/mocks/data';
import { useMarketplaceActions } from '../../../hooks/useMarketplaceActions';
import { useAppInstallationHandler } from '../../../hooks/useAppInstallationHandler';

jest.mock('../../../hooks/useMarketplaceActions');
jest.mock('../../../hooks/useAppInstallationHandler');

describe('AppStatus', () => {
	const mockInstall = jest.fn();
	const mockUpdate = jest.fn();
	const mockPurchase = jest.fn();
	const mockAppInstallationHandler = jest.fn();

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
		(useMarketplaceActions as jest.Mock).mockReturnValue({
			install: mockInstall,
			update: mockUpdate,
			purchase: mockPurchase,
		});
		(useAppInstallationHandler as jest.Mock).mockReturnValue(mockAppInstallationHandler);
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

		await userEvent.click(screen.getByRole('button', { name: 'Request' }));
	});

	it('should reset loading state when install action throws an error', async () => {
		const app = createFakeApp({
			installed: false,
			isPurchased: false,
			price: 0,
			purchaseType: 'buy',
			versionIncompatible: false,
		});
		const installError = new Error('install failed');
		mockInstall.mockRejectedValue(installError);

		let onSuccessCallback: (action: string, appPermissions?: unknown) => Promise<void>;
		(useAppInstallationHandler as jest.Mock).mockImplementation(({ onSuccess }) => {
			onSuccessCallback = onSuccess;
			return mockAppInstallationHandler;
		});

		render(<AppStatus app={app} showStatus isAppDetailsPage />, {
			wrapper: createWrapper(),
		});

		const button = screen.getByRole('button', { name: 'Install' });
		await userEvent.click(button);
		await act(async () => {
			try {
				await onSuccessCallback!('install');
			} catch (err) {
				expect(err).toBe(installError);
			}
		});
		await waitFor(() => {
			expect(button).not.toBeDisabled();
		});
		expect(mockInstall).toHaveBeenCalled();
	});

	it('should reset loading state when update action throws an error', async () => {
		const app = createFakeApp({
			installed: true,
			version: '1.0.0',
			marketplaceVersion: '2.0.0',
		});
		const updateError = new Error('update failed');
		mockUpdate.mockRejectedValue(updateError);

		let onSuccessCallback: (action: string, appPermissions?: unknown) => Promise<void>;
		(useAppInstallationHandler as jest.Mock).mockImplementation(({ onSuccess }) => {
			onSuccessCallback = onSuccess;
			return mockAppInstallationHandler;
		});

		render(<AppStatus app={app} showStatus isAppDetailsPage installed />, {
			wrapper: createWrapper({ installedApps: 1, totalMarketplaceEnabled: 1 }),
		});

		const button = screen.getByRole('button', { name: 'Update' });
		await userEvent.click(button);
		await act(async () => {
			try {
				await onSuccessCallback!('update');
			} catch (err) {
				expect(err).toBe(updateError);
			}
		});
		await waitFor(() => {
			expect(button).not.toBeDisabled();
		});
		expect(mockUpdate).toHaveBeenCalled();
	});

	it('should reset loading state when purchase action throws an error', async () => {
		const app = createFakeApp({
			installed: false,
			isPurchased: false,
			price: 10,
			purchaseType: 'buy',
		});
		const purchaseError = new Error('purchase failed');
		mockPurchase.mockRejectedValue(purchaseError);

		let onSuccessCallback: (action: string, appPermissions?: unknown) => Promise<void>;
		(useAppInstallationHandler as jest.Mock).mockImplementation(({ onSuccess }) => {
			onSuccessCallback = onSuccess;
			return mockAppInstallationHandler;
		});

		render(<AppStatus app={app} showStatus isAppDetailsPage />, {
			wrapper: createWrapper(),
		});

		const button = screen.getByRole('button', { name: 'Buy' });
		await userEvent.click(button);
		await act(async () => {
			try {
				await onSuccessCallback!('purchase');
			} catch (err) {
				expect(err).toBe(purchaseError);
			}
		});
		await waitFor(() => {
			expect(button).not.toBeDisabled();
		});
		expect(mockPurchase).toHaveBeenCalled();
	});
});
