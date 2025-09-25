import { faker } from '@faker-js/faker';

import injectInitialData from '../fixtures/inject-initial-data';
import { Users, storeState, restoreState } from '../fixtures/userStates';
import { AccountProfile, HomeChannel } from '../page-objects';
import { setupE2EEPassword } from './setupE2EEPassword';
import { AccountSecurityPage } from '../page-objects/account-security';
import { EncryptedRoomPage } from '../page-objects/encrypted-room';
import { HomeSidenav } from '../page-objects/fragments';
import {
	E2EEKeyDecodeFailureBanner,
	EnterE2EEPasswordBanner,
	EnterE2EEPasswordModal,
	ResetE2EEPasswordModal,
	CreateE2EEChannel,
} from '../page-objects/fragments/e2ee';
import { LoginPage } from '../page-objects/login';
import { deleteRoom } from '../utils/create-target-channel';
import { preserveSettings } from '../utils/preserveSettings';
import { test, expect } from '../utils/test';

const settingsList = [
	'E2E_Enable',
	'E2E_Allow_Unencrypted_Messages',
	'E2E_Enabled_Default_DirectRooms',
	'E2E_Enabled_Default_PrivateRooms',
];

test.describe('E2EE Passphrase Management - Initial Setup', () => {
	let loginPage: LoginPage;
	let enterE2EEPasswordBanner: EnterE2EEPasswordBanner;
	let enterE2EEPasswordModal: EnterE2EEPasswordModal;
	let e2EEKeyDecodeFailureBanner: E2EEKeyDecodeFailureBanner;
	let sidenav: HomeSidenav;
	let accountSecurityPage: AccountSecurityPage;
	let resetE2EEPasswordModal: ResetE2EEPasswordModal;

	test.use({ storageState: Users.admin.state });

	preserveSettings(settingsList);

	test.beforeAll(async ({ api }) => {
		await api.post('/settings/E2E_Enable', { value: true });
		await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: true });
		await api.post('/settings/E2E_Enabled_Default_DirectRooms', { value: false });
		await api.post('/settings/E2E_Enabled_Default_PrivateRooms', { value: false });
	});

	test.beforeEach(async ({ api, page }) => {
		loginPage = new LoginPage(page);
		enterE2EEPasswordBanner = new EnterE2EEPasswordBanner(page);
		enterE2EEPasswordModal = new EnterE2EEPasswordModal(page);
		e2EEKeyDecodeFailureBanner = new E2EEKeyDecodeFailureBanner(page);
		sidenav = new HomeSidenav(page);
		accountSecurityPage = new AccountSecurityPage(page);
		resetE2EEPasswordModal = new ResetE2EEPasswordModal(page);

		await api.post('/method.call/e2e.resetOwnE2EKey', {
			message: JSON.stringify({ msg: 'method', id: '1', method: 'e2e.resetOwnE2EKey', params: [] }),
		});

		await page.goto('/home');
		await loginPage.waitForIt();
		await loginPage.loginByUserState(Users.admin);
	});

	test('expect the randomly generated password to work', async ({ page }) => {
		const password = await setupE2EEPassword(page);

		// Log out
		await sidenav.logout();

		// Login again
		await loginPage.loginByUserState(Users.admin);

		// Enter the saved password
		await enterE2EEPasswordBanner.click();
		await enterE2EEPasswordModal.enterPassword(password);

		// No error banner
		await e2EEKeyDecodeFailureBanner.expectToNotBeVisible();
	});

	test('expect to manually reset the password', async () => {
		// Reset the E2EE key to start the flow from the beginning
		await accountSecurityPage.goto();
		await accountSecurityPage.resetE2EEPassword();

		await loginPage.loginByUserState(Users.admin);
	});

	test('should reset e2e password from the modal', async ({ page }) => {
		await setupE2EEPassword(page);

		// Logout
		await sidenav.logout();

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
		const newPassword = faker.string.uuid();

		await setupE2EEPassword(page);

		// Set a new password
		await accountSecurityPage.goto();
		await accountSecurityPage.setE2EEPassword(newPassword);
		await accountSecurityPage.close();

		// Log out
		await sidenav.logout();

		// Login again
		await loginPage.loginByUserState(Users.admin);

		// Enter the saved password
		await enterE2EEPasswordBanner.click();
		await enterE2EEPasswordModal.enterPassword(newPassword);

		// No error banner
		await e2EEKeyDecodeFailureBanner.expectToNotBeVisible();
	});
});

test.use({ storageState: Users.admin.state });

const roomSetupSettingsList = ['E2E_Enable', 'E2E_Allow_Unencrypted_Messages'];

test.describe.serial('E2EE Passphrase Management - Room Setup States', () => {
	const createdChannels: { name: string; id?: string | null }[] = [];
	let poAccountProfile: AccountProfile;
	let poHomeChannel: HomeChannel;
	let encryptedRoomPage: EncryptedRoomPage;
	let loginPage: LoginPage;
	let enterE2EEPasswordModal: EnterE2EEPasswordModal;
	let e2eePassword: string;

	preserveSettings(roomSetupSettingsList);

	test.afterAll(async ({ api }) => {
		await Promise.all(createdChannels.map(({ id }) => (id ? deleteRoom(api, id) : Promise.resolve())));
	});

	test.beforeEach(async ({ page }) => {
		poAccountProfile = new AccountProfile(page);
		poHomeChannel = new HomeChannel(page);
		encryptedRoomPage = new EncryptedRoomPage(page);
		loginPage = new LoginPage(page);
		enterE2EEPasswordModal = new EnterE2EEPasswordModal(page);
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
		await poAccountProfile.securityE2EEncryptionSection.click();
		await poAccountProfile.securityE2EEncryptionResetKeyButton.click();

		await loginPage.waitForIt();

		await injectInitialData();
		await restoreState(page, Users.admin);

		await page.goto('/home');
		await page.waitForSelector('#main-content');

		await expect(poHomeChannel.bannerSaveEncryptionPassword).toBeVisible();

		const channelName = faker.string.uuid();

		const createE2EEChannel = new CreateE2EEChannel(page);
		await createE2EEChannel.createAndStore(channelName, createdChannels);

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
		await expect(encryptedRoomPage.lastMessage.encryptedIcon).toBeVisible();
	});

	test('expect enter password state on encrypted room', async ({ page }) => {
		await page.goto('/home');

		// Logout to remove e2ee keys
		await poHomeChannel.sidenav.logout();

		await injectInitialData();
		await restoreState(page, Users.admin, { except: ['private_key', 'public_key'] });

		const channelName = faker.string.uuid();

		const createE2EEChannel = new CreateE2EEChannel(page);
		await createE2EEChannel.createAndStore(channelName, createdChannels);

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

		await enterE2EEPasswordModal.enterPassword(e2eePassword);

		await expect(poHomeChannel.bannerEnterE2EEPassword).not.toBeVisible();

		await poHomeChannel.content.inputMessage.waitFor();
		// For E2EE to complete init setup
		await page.waitForTimeout(300);

		await poHomeChannel.content.sendMessage('hello world');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world');
		await expect(encryptedRoomPage.lastMessage.encryptedIcon).toBeVisible();

		await storeState(page, Users.admin);
	});

	test('expect waiting for room keys state', async ({ page }) => {
		await page.goto('/home');

		const channelName = faker.string.uuid();

		const createE2EEChannel = new CreateE2EEChannel(page);
		await createE2EEChannel.createAndStore(channelName, createdChannels);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon.first()).toBeVisible();

		await poHomeChannel.content.sendMessage('hello world');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world');
		await expect(encryptedRoomPage.lastMessage.encryptedIcon).toBeVisible();

		await poHomeChannel.sidenav.btnUserProfileMenu.click();
		await poHomeChannel.sidenav.accountProfileOption.click();

		await page.getByRole('navigation').getByRole('link', { name: 'Security' }).click();

		await poAccountProfile.securityE2EEncryptionSection.click();
		await poAccountProfile.securityE2EEncryptionResetKeyButton.click();

		await loginPage.waitForIt();

		await page.reload();

		await loginPage.waitForIt();

		await injectInitialData();
		await restoreState(page, Users.admin);

		await poHomeChannel.sidenav.openSearch();
		await poHomeChannel.sidenav.inputSearch.fill(channelName);
		await poHomeChannel.sidenav.getSearchItemByName(channelName).click();

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
