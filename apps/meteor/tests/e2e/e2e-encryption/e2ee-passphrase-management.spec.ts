import { faker } from '@faker-js/faker';

import injectInitialData from '../fixtures/inject-initial-data';
import { Users, storeState, restoreState } from '../fixtures/userStates';
import { AccountSecurity, HomeChannel } from '../page-objects';
import { setupE2EEPassword } from './setupE2EEPassword';
import { Navbar } from '../page-objects/fragments';
import { E2EEKeyDecodeFailureBanner, EnterE2EEPasswordBanner } from '../page-objects/fragments/e2ee';
import { EnterE2EEPasswordModal, ResetE2EEPasswordModal } from '../page-objects/fragments/modals';
import { LoginPage } from '../page-objects/login';
import { preserveSettings } from '../utils/preserveSettings';
import { test, expect } from '../utils/test';

const settingsList = [
	'E2E_Enable',
	'E2E_Allow_Unencrypted_Messages',
	'E2E_Enabled_Default_DirectRooms',
	'E2E_Enabled_Default_PrivateRooms',
];

const originalSettings = preserveSettings(settingsList);

test.describe('E2EE Passphrase Management - Initial Setup', () => {
	test.use({ storageState: Users.admin.state });

	test.beforeAll(async ({ api }) => {
		await api.post('/settings/E2E_Enable', { value: true });
		await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: true });
		await api.post('/settings/E2E_Enabled_Default_DirectRooms', { value: false });
		await api.post('/settings/E2E_Enabled_Default_PrivateRooms', { value: false });
	});

	test.afterAll(async ({ api }) => {
		await api.post('/settings/E2E_Enable', { value: originalSettings.E2E_Enable });
		await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: originalSettings.E2E_Allow_Unencrypted_Messages });
		await api.post('/settings/E2E_Enabled_Default_DirectRooms', { value: originalSettings.E2E_Enabled_Default_DirectRooms });
		await api.post('/settings/E2E_Enabled_Default_PrivateRooms', { value: originalSettings.E2E_Enabled_Default_PrivateRooms });
	});

	test.describe('Generate', () => {
		test.beforeEach(async ({ page, api }) => {
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
			const enterE2EEPasswordBanner = new EnterE2EEPasswordBanner(page);
			const enterE2EEPasswordModal = new EnterE2EEPasswordModal(page);
			const e2EEKeyDecodeFailureBanner = new E2EEKeyDecodeFailureBanner(page);
			const navbar = new Navbar(page);

			const password = await setupE2EEPassword(page);

			// Log out
			await navbar.logout();

			// Login again
			await loginPage.loginByUserState(Users.admin);

			// Enter the saved password
			await enterE2EEPasswordBanner.click();
			await enterE2EEPasswordModal.enterPassword(password);

			// No error banner
			await e2EEKeyDecodeFailureBanner.expectToNotBeVisible();
		});

		test('expect to manually reset the password', async ({ page }) => {
			const accountSecurityPage = new AccountSecurity(page);
			const loginPage = new LoginPage(page);

			// Reset the E2EE key to start the flow from the beginning
			await accountSecurityPage.goto();
			await accountSecurityPage.resetE2EEPassword();

			await loginPage.loginByUserState(Users.admin);
		});

		test('should reset e2e password from the modal', async ({ page }) => {
			const navbar = new Navbar(page);
			const loginPage = new LoginPage(page);
			const enterE2EEPasswordBanner = new EnterE2EEPasswordBanner(page);
			const enterE2EEPasswordModal = new EnterE2EEPasswordModal(page);
			const resetE2EEPasswordModal = new ResetE2EEPasswordModal(page);

			await setupE2EEPassword(page);

			// Logout
			await navbar.logout();

			// Login again
			await loginPage.loginByUserState(Users.admin);

			// Reset E2EE password
			await enterE2EEPasswordBanner.click();
			await enterE2EEPasswordModal.forgotPassword();
			await resetE2EEPasswordModal.confirmReset();

			// restore login
			await loginPage.loginByUserState(Users.admin);
		});

		test('expect to manually set a new password', async ({ page }) => {
			const accountSecurityPage = new AccountSecurity(page);
			const loginPage = new LoginPage(page);
			const enterE2EEPasswordBanner = new EnterE2EEPasswordBanner(page);
			const enterE2EEPasswordModal = new EnterE2EEPasswordModal(page);
			const e2EEKeyDecodeFailureBanner = new E2EEKeyDecodeFailureBanner(page);
			const navbar = new Navbar(page);

			const newPassword = faker.internet.password({
				length: 30,
				prefix:
					faker.string.alpha({ casing: 'lower' }) +
					faker.string.alpha({ casing: 'upper' }) +
					faker.string.numeric() +
					faker.string.symbol(),
			});

			await setupE2EEPassword(page);

			// Set a new password
			await accountSecurityPage.goto();
			await accountSecurityPage.setE2EEPassword(newPassword);
			await accountSecurityPage.close();

			// Log out
			await navbar.logout();

			// Login again
			await loginPage.loginByUserState(Users.admin);

			// Enter the saved password
			await enterE2EEPasswordBanner.click();
			await enterE2EEPasswordModal.enterPassword(newPassword);

			// No error banner
			await e2EEKeyDecodeFailureBanner.expectToNotBeVisible();
		});
	});

	test.describe('Recovery', () => {
		test.use({ storageState: Users.userE2EE.state });

		test('expect to recover the keys using the recovery key', async ({ page }) => {
			await test.step('Recover the keys', async () => {
				await page.goto('/home');
				await injectInitialData();
				await restoreState(page, Users.userE2EE);
				const navbar = new Navbar(page);

				await navbar.logout();

				const loginPage = new LoginPage(page);
				await loginPage.loginByUserState(Users.userE2EE, { except: ['private_key', 'public_key'] });

				const enterE2EEPasswordBanner = new EnterE2EEPasswordBanner(page);
				const enterE2EEPasswordModal = new EnterE2EEPasswordModal(page);
				const e2EEKeyDecodeFailureBanner = new E2EEKeyDecodeFailureBanner(page);

				await enterE2EEPasswordBanner.click();
				await enterE2EEPasswordModal.enterPassword('minus mobile dexter forest elvis');
				await e2EEKeyDecodeFailureBanner.expectToNotBeVisible();
			});
		});
	});
});

test.use({ storageState: Users.admin.state });

const roomSetupSettingsList = ['E2E_Enable', 'E2E_Allow_Unencrypted_Messages'];

test.describe.serial('E2EE Passphrase Management - Room Setup States', () => {
	let poAccountSecurity: AccountSecurity;
	let poHomeChannel: HomeChannel;
	let e2eePassword: string;

	preserveSettings(roomSetupSettingsList);

	test.beforeEach(async ({ page }) => {
		poAccountSecurity = new AccountSecurity(page);
		poHomeChannel = new HomeChannel(page);
	});

	test.beforeAll(async ({ api }) => {
		await api.post('/settings/E2E_Enable', { value: true });
		await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: false });
	});

	test.afterEach(async ({ api }) => {
		await api.recreateContext();
	});

	test('expect save password state on encrypted room', async ({ page }) => {
		await page.goto('/account/security');
		await poAccountSecurity.securityE2EEncryptionSection.click();
		await poAccountSecurity.securityE2EEncryptionResetKeyButton.click();

		await page.locator('role=button[name="Login"]').waitFor();

		await injectInitialData();
		await restoreState(page, Users.admin);

		await page.goto('/home');
		await page.waitForSelector('#main-content');

		await expect(poHomeChannel.bannerSaveEncryptionPassword).toBeVisible();

		const channelName = faker.string.uuid();

		await poHomeChannel.navbar.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon.first()).toBeVisible();
		await expect(poHomeChannel.btnRoomSaveE2EEPassword).toBeVisible();

		await poHomeChannel.roomToolbar.btnDisableE2EEncryption.waitFor();
		await expect(poHomeChannel.roomToolbar.btnDisableE2EEncryption).toBeVisible();
		await expect(poHomeChannel.roomToolbar.btnMembers).toBeVisible();
		await expect(poHomeChannel.roomToolbar.btnRoomInfo).toBeVisible();

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
		await poHomeChannel.navbar.logout();

		await injectInitialData();
		await restoreState(page, Users.admin, { except: ['private_key', 'public_key'] });

		const channelName = faker.string.uuid();

		await poHomeChannel.navbar.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon.first()).toBeVisible();

		await poHomeChannel.btnRoomEnterE2EEPassword.waitFor();

		await expect(poHomeChannel.btnRoomEnterE2EEPassword).toBeVisible();

		await poHomeChannel.roomToolbar.btnDisableE2EEncryption.waitFor();
		await expect(poHomeChannel.roomToolbar.btnDisableE2EEncryption).toBeVisible();
		await expect(poHomeChannel.roomToolbar.btnMembers).toBeVisible();
		await expect(poHomeChannel.roomToolbar.btnRoomInfo).toBeVisible();

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

		await poHomeChannel.navbar.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon.first()).toBeVisible();

		await poHomeChannel.content.sendMessage('hello world');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();

		await poHomeChannel.navbar.btnUserMenu.click();
		await poHomeChannel.navbar.getUserProfileMenuOption('Profile').click();

		await poAccountSecurity.sidebar.linkSecurity.click();

		await poAccountSecurity.securityE2EEncryptionSection.click();
		await poAccountSecurity.securityE2EEncryptionResetKeyButton.click();

		await page.locator('role=button[name="Login"]').waitFor();

		await page.reload();

		await page.locator('role=button[name="Login"]').waitFor();

		await injectInitialData();
		await restoreState(page, Users.admin);

		await poHomeChannel.navbar.typeSearch(channelName);
		await poHomeChannel.navbar.getSearchRoomByName(channelName).click();

		await poHomeChannel.btnRoomSaveE2EEPassword.click();
		await poHomeChannel.btnSavedMyPassword.click();

		await expect(poHomeChannel.content.inputMessage).not.toBeVisible();
		await expect(page.locator('.rcx-states__title')).toContainText('Check back later');

		await poHomeChannel.roomToolbar.btnDisableE2EEncryption.waitFor();
		await expect(poHomeChannel.roomToolbar.btnDisableE2EEncryption).toBeVisible();
		await expect(poHomeChannel.roomToolbar.btnMembers).toBeVisible();
		await expect(poHomeChannel.roomToolbar.btnRoomInfo).toBeVisible();
	});
});
