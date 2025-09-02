import { faker } from '@faker-js/faker';

import injectInitialData from '../fixtures/inject-initial-data';
import { Users } from '../fixtures/userStates';
import { AccountSecurityPage } from '../page-objects/account-security';
import { HomeSidenav } from '../page-objects/fragments';
import {
	E2EEKeyDecodeFailureBanner,
	EnterE2EEPasswordBanner,
	EnterE2EEPasswordModal,
	SaveE2EEPasswordBanner,
	SaveE2EEPasswordModal,
} from '../page-objects/fragments/e2ee';
import { LoginPage } from '../page-objects/login';
import { test, expect } from '../utils/test';

test.beforeAll(async () => {
	await injectInitialData();
});

test.describe('e2e encryption - initial setup', () => {
	test.use({ storageState: Users.admin.state });

	test.beforeAll(async ({ api }) => {
		await api.post('/settings/E2E_Enable', { value: true });
		await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: true });
	});

	test.afterAll(async ({ api }) => {
		await api.post('/settings/E2E_Enable', { value: false });
		await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: false });
	});

	test.beforeEach(async ({ api, page }) => {
		const loginPage = new LoginPage(page);

		await api.post('/method.call/e2e.resetOwnE2EKey', {
			message: JSON.stringify({ msg: 'method', id: '1', method: 'e2e.resetOwnE2EKey', params: [] }),
		});

		await page.goto('/home');
		await loginPage.waitForIt();
		await loginPage.loginByUserState(Users.admin);
	});

	test('expect the randomly generated password to work', async ({ page }) => {
		const loginPage = new LoginPage(page);
		const saveE2EEPasswordBanner = new SaveE2EEPasswordBanner(page);
		const saveE2EEPasswordModal = new SaveE2EEPasswordModal(page);
		const enterE2EEPasswordBanner = new EnterE2EEPasswordBanner(page);
		const enterE2EEPasswordModal = new EnterE2EEPasswordModal(page);
		const e2EEKeyDecodeFailureBanner = new E2EEKeyDecodeFailureBanner(page);
		const sidenav = new HomeSidenav(page);

		// Click the banner to open the dialog to save the generated password
		await saveE2EEPasswordBanner.click();
		const password = await saveE2EEPasswordModal.getPassword();
		await saveE2EEPasswordModal.confirm();
		await saveE2EEPasswordBanner.waitForDisappearance();

		// Log out
		await sidenav.logout();

		await expect(loginPage.loginButton).toBeVisible();

		// Login again
		await loginPage.loginByUserState(Users.admin);

		// Enter the saved password
		await enterE2EEPasswordBanner.click();
		await enterE2EEPasswordModal.enterPassword(password);

		// No error banner
		await e2EEKeyDecodeFailureBanner.expectToNotBeVisible();
	});

	test('expect to manually reset the password', async ({ page }) => {
		const accountSecurityPage = new AccountSecurityPage(page);
		const loginPage = new LoginPage(page);

		// Reset the E2EE key to start the flow from the beginning
		await accountSecurityPage.goto();
		await accountSecurityPage.resetE2EEPassword();

		await loginPage.loginByUserState(Users.admin);
	});

	test('expect to manually set a new password', async ({ page }) => {
		const accountSecurityPage = new AccountSecurityPage(page);
		const loginPage = new LoginPage(page);
		const saveE2EEPasswordBanner = new SaveE2EEPasswordBanner(page);
		const saveE2EEPasswordModal = new SaveE2EEPasswordModal(page);
		const enterE2EEPasswordBanner = new EnterE2EEPasswordBanner(page);
		const enterE2EEPasswordModal = new EnterE2EEPasswordModal(page);
		const e2EEKeyDecodeFailureBanner = new E2EEKeyDecodeFailureBanner(page);
		const sidenav = new HomeSidenav(page);

		const newPassword = faker.string.uuid();

		// Click the banner to open the dialog to save the generated password
		await saveE2EEPasswordBanner.click();
		await saveE2EEPasswordModal.confirm();
		await saveE2EEPasswordBanner.waitForDisappearance();

		// Set a new password
		await accountSecurityPage.goto();
		await accountSecurityPage.setE2EEPassword(newPassword);
		await accountSecurityPage.close();

		// Log out
		await sidenav.logout();

		// Login again
		await expect(loginPage.loginButton).toBeVisible();

		await loginPage.loginByUserState(Users.admin);

		// Enter the saved password
		await enterE2EEPasswordBanner.click();
		await enterE2EEPasswordModal.enterPassword(newPassword);

		// No error banner
		await e2EEKeyDecodeFailureBanner.expectToNotBeVisible();
	});
});
