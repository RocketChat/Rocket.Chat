import type { ProxiedApp } from '@rocket.chat/apps/dist/server/ProxiedApp';
import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';

import { notifyAdminsAboutRenewedApps } from './notifyAdminsAboutRenewedApps';

const mockSendMessagesToAdmins = jest.fn();

jest.mock('../../../server/lib/i18n', () => ({
	i18n: { t: (key: string) => key },
}));

jest.mock('../../../server/lib/sendMessagesToAdmins', () => ({
	sendMessagesToAdmins: (...args: unknown[]) => mockSendMessagesToAdmins(...args),
}));

const makeApp = (status: AppStatus, previousStatus: AppStatus) =>
	({
		getStatus: jest.fn().mockResolvedValue(status),
		getPreviousStatus: jest.fn().mockReturnValue(previousStatus),
	}) as unknown as ProxiedApp;

describe('notifyAdminsAboutRenewedApps', () => {
	beforeEach(() => {
		mockSendMessagesToAdmins.mockClear();
	});

	it('should not notify admins when no app was previously INVALID_LICENSE_DISABLED', async () => {
		await notifyAdminsAboutRenewedApps([
			makeApp(AppStatus.DISABLED, AppStatus.MANUALLY_DISABLED),
			makeApp(AppStatus.AUTO_ENABLED, AppStatus.INITIALIZED),
		]);

		expect(mockSendMessagesToAdmins).not.toHaveBeenCalled();
	});

	it('should not notify admins when the app was INVALID_LICENSE_DISABLED but is not DISABLED now', async () => {
		await notifyAdminsAboutRenewedApps([makeApp(AppStatus.INVALID_LICENSE_DISABLED, AppStatus.INVALID_LICENSE_DISABLED)]);

		expect(mockSendMessagesToAdmins).not.toHaveBeenCalled();
	});

	it('should notify admins when an app moved from INVALID_LICENSE_DISABLED to DISABLED', async () => {
		await notifyAdminsAboutRenewedApps([
			makeApp(AppStatus.AUTO_ENABLED, AppStatus.INITIALIZED),
			makeApp(AppStatus.DISABLED, AppStatus.INVALID_LICENSE_DISABLED),
		]);

		expect(mockSendMessagesToAdmins).toHaveBeenCalledTimes(1);
	});

	it('should not notify admins when apps are not provided', async () => {
		await notifyAdminsAboutRenewedApps(undefined);

		expect(mockSendMessagesToAdmins).not.toHaveBeenCalled();
	});
});
