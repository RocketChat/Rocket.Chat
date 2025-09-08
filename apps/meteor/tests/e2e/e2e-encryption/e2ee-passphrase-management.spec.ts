import { faker } from '@faker-js/faker';

import injectInitialData from '../fixtures/inject-initial-data';
import { Users, storeState, restoreState } from '../fixtures/userStates';
import { AccountProfile, HomeChannel } from '../page-objects';
import { AccountSecurityPage } from '../page-objects/account-security';
import { HomeSidenav } from '../page-objects/fragments';
import {
	E2EEKeyDecodeFailureBanner,
	EnterE2EEPasswordBanner,
	EnterE2EEPasswordModal,
	ResetE2EEPasswordModal,
	SaveE2EEPasswordBanner,
	SaveE2EEPasswordModal,
} from '../page-objects/fragments/e2ee';
import { LoginPage } from '../page-objects/login';
import { getSettingValueById } from '../utils';
import { test, expect } from '../utils/test';

test.describe('E2EE Passphrase Management - Initial Setup', () => {
	test.use({ storageState: Users.admin.state });

	test.beforeAll(async ({ api }) => {
		// Set settings for this describe block only
		await api.post('/settings/E2E_Enable', { value: true });
		await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: true });
		await api.post('/settings/E2E_Enabled_Default_DirectRooms', { value: false });
		await api.post('/settings/E2E_Enabled_Default_PrivateRooms', { value: false });
	});

	test.afterAll(async ({ api }) => {
		// Restore original settings
		await api.post('/settings/E2E_Enable', { value: false });
		await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: false });
		await api.post('/settings/E2E_Enabled_Default_DirectRooms', { value: false });
		await api.post('/settings/E2E_Enabled_Default_PrivateRooms', { value: false });
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

	test('should reset e2e password from the modal', async ({ page }) => {
		const sidenav = new HomeSidenav(page);
		const loginPage = new LoginPage(page);
		const enterE2EEPasswordBanner = new EnterE2EEPasswordBanner(page);
		const enterE2EEPasswordModal = new EnterE2EEPasswordModal(page);
		const resetE2EEPasswordModal = new ResetE2EEPasswordModal(page);

		await sidenav.logout();
		await expect(loginPage.loginButton).toBeVisible();
		await loginPage.loginByUserState(Users.admin);
		await enterE2EEPasswordBanner.click();
		await enterE2EEPasswordModal.forgotPassword();
		await resetE2EEPasswordModal.confirmReset();

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

test.use({ storageState: Users.admin.state });

const roomSetupSettings = {
	E2E_Enable: false as unknown,
	E2E_Allow_Unencrypted_Messages: false as unknown,
};

test.describe.serial('E2EE Passphrase Management - Room Setup States', () => {
	let poAccountProfile: AccountProfile;
	let poHomeChannel: HomeChannel;
	let e2eePassword: string;

	test.beforeEach(async ({ page }) => {
		poAccountProfile = new AccountProfile(page);
		poHomeChannel = new HomeChannel(page);
	});

	test.beforeAll(async ({ api }) => {
		roomSetupSettings.E2E_Enable = await getSettingValueById(api, 'E2E_Enable');
		roomSetupSettings.E2E_Allow_Unencrypted_Messages = await getSettingValueById(api, 'E2E_Allow_Unencrypted_Messages');
		await api.post('/settings/E2E_Enable', { value: true });
		await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: false });
	});

	test.afterAll(async ({ api }) => {
		await api.post('/settings/E2E_Enable', { value: roomSetupSettings.E2E_Enable });
		await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: roomSetupSettings.E2E_Allow_Unencrypted_Messages });
	});

	test.afterEach(async ({ api }) => {
		await api.recreateContext();
	});

	test('expect save password state on encrypted room', async ({ page }) => {
		await page.goto('/account/security');
		await poAccountProfile.securityE2EEncryptionSection.click();
		await poAccountProfile.securityE2EEncryptionResetKeyButton.click();

		await page.locator('role=button[name="Login"]').waitFor();

		await injectInitialData();
		await restoreState(page, Users.admin);

		await page.goto('/home');
		await page.waitForSelector('#main-content');

		await expect(poHomeChannel.bannerSaveEncryptionPassword).toBeVisible();

		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon.first()).toBeVisible();
		await expect(poHomeChannel.btnRoomSaveE2EEPassword).toBeVisible();

		await poHomeChannel.tabs.btnE2EERoomSetupDisableE2E.waitFor();
		await expect(poHomeChannel.tabs.btnE2EERoomSetupDisableE2E).toBeVisible();
		await expect(poHomeChannel.tabs.btnTabMembers).toBeVisible();
		await expect(poHomeChannel.tabs.btnRoomInfo).toBeVisible();

		await expect(poHomeChannel.content.inputMessage).not.toBeVisible();

		await poHomeChannel.btnRoomSaveE2EEPassword.click();

		e2eePassword = (await page.evaluate(() => localStorage.getItem('e2e.randomPassword'))) || 'undefined';

		await expect(poHomeChannel.dialogSaveE2EEPassword).toBeVisible();
		await expect(poHomeChannel.dialogSaveE2EEPassword).toContainText(e2eePassword);

		await poHomeChannel.btnSavedMyPassword.click();

		await poHomeChannel.content.inputMessage.waitFor();

		await poHomeChannel.content.sendMessage('hello world');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();
	});

	test('expect enter password state on encrypted room', async ({ page }) => {
		await page.goto('/home');

		// Logout to remove e2ee keys
		await poHomeChannel.sidenav.logout();

		await page.locator('role=button[name="Login"]').waitFor();

		await injectInitialData();
		await restoreState(page, Users.admin, { except: ['private_key', 'public_key'] });

		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon.first()).toBeVisible();

		await poHomeChannel.btnRoomEnterE2EEPassword.waitFor();

		await expect(poHomeChannel.btnRoomEnterE2EEPassword).toBeVisible();

		await poHomeChannel.tabs.btnE2EERoomSetupDisableE2E.waitFor();
		await expect(poHomeChannel.tabs.btnE2EERoomSetupDisableE2E).toBeVisible();
		await expect(poHomeChannel.tabs.btnTabMembers).toBeVisible();
		await expect(poHomeChannel.tabs.btnRoomInfo).toBeVisible();

		await expect(poHomeChannel.content.inputMessage).not.toBeVisible();

		await poHomeChannel.btnRoomEnterE2EEPassword.click();

		await page.locator('#modal-root input').fill(e2eePassword);

		await page.locator('#modal-root .rcx-button--primary').click();

		await expect(poHomeChannel.bannerEnterE2EEPassword).not.toBeVisible();

		await poHomeChannel.content.inputMessage.waitFor();
		// For E2EE to complete init setup
		await page.waitForTimeout(300);

		await poHomeChannel.content.sendMessage('hello world');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();

		await storeState(page, Users.admin);
	});

	test('expect waiting for room keys state', async ({ page }) => {
		await page.goto('/home');

		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon.first()).toBeVisible();

		await poHomeChannel.content.sendMessage('hello world');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();

		await poHomeChannel.sidenav.btnUserProfileMenu.click();
		await poHomeChannel.sidenav.accountProfileOption.click();

		await page.locator('role=navigation >> a:has-text("Security")').click();

		await poAccountProfile.securityE2EEncryptionSection.click();
		await poAccountProfile.securityE2EEncryptionResetKeyButton.click();

		await page.locator('role=button[name="Login"]').waitFor();

		await page.reload();

		await page.locator('role=button[name="Login"]').waitFor();

		await injectInitialData();
		await restoreState(page, Users.admin);

		await page.locator('role=navigation >> role=button[name=Search]').click();
		await page.locator('role=search >> role=searchbox').fill(channelName);
		await page.locator(`role=search >> role=listbox >> role=link >> text="${channelName}"`).click();

		await poHomeChannel.btnRoomSaveE2EEPassword.click();
		await poHomeChannel.btnSavedMyPassword.click();

		await expect(poHomeChannel.content.inputMessage).not.toBeVisible();
		await expect(page.locator('.rcx-states__title')).toContainText('Check back later');

		await poHomeChannel.tabs.btnE2EERoomSetupDisableE2E.waitFor();
		await expect(poHomeChannel.tabs.btnE2EERoomSetupDisableE2E).toBeVisible();
		await expect(poHomeChannel.tabs.btnTabMembers).toBeVisible();
		await expect(poHomeChannel.tabs.btnRoomInfo).toBeVisible();
	});
});
