import type { ProxiedApp } from '@rocket.chat/apps/dist/server/ProxiedApp';

import { notifyAdminsAboutInvalidApps } from './notifyAdminsAboutInvalidApps';

const mockSendMessagesToAdmins = jest.fn();

jest.mock('@rocket.chat/models', () => ({
	Users: { removeBannerById: jest.fn() },
}));

jest.mock('../../../server/lib/i18n', () => ({
	i18n: { t: (key: string) => key },
}));

jest.mock('../../../server/lib/sendMessagesToAdmins', () => ({
	sendMessagesToAdmins: (...args: unknown[]) => mockSendMessagesToAdmins(...args),
}));

const makeApp = (hasErrors: boolean) =>
	({
		getLatestLicenseValidationResult: jest.fn().mockReturnValue({ hasErrors }),
	}) as unknown as ProxiedApp;

describe('notifyAdminsAboutInvalidApps', () => {
	beforeEach(() => {
		mockSendMessagesToAdmins.mockClear();
	});

	it('should not notify admins when no app has license errors', async () => {
		await notifyAdminsAboutInvalidApps([makeApp(false)]);

		expect(mockSendMessagesToAdmins).not.toHaveBeenCalled();
	});

	it('should return the apps when no app has license errors so the next step in the cron chain receives them', async () => {
		const apps = [makeApp(false)];

		await expect(notifyAdminsAboutInvalidApps(apps)).resolves.toBe(apps);
	});

	it('should notify admins and return the apps when an app has license errors', async () => {
		const apps = [makeApp(false), makeApp(true)];

		await expect(notifyAdminsAboutInvalidApps(apps)).resolves.toBe(apps);

		expect(mockSendMessagesToAdmins).toHaveBeenCalledTimes(1);
	});

	it('should return undefined when apps are not provided', async () => {
		await expect(notifyAdminsAboutInvalidApps(undefined)).resolves.toBeUndefined();
	});
});
