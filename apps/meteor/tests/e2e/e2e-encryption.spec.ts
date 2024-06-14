import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { createAuxContext } from './fixtures/createAuxContext';
import injectInitialData from './fixtures/inject-initial-data';
import { Users, storeState, restoreState } from './fixtures/userStates';
import { AccountProfile, HomeChannel } from './page-objects';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('e2e-encryption initial setup', () => {
	let poAccountProfile: AccountProfile;
	let poHomeChannel: HomeChannel;
	let password: string;

	test.beforeEach(async ({ page }) => {
		poAccountProfile = new AccountProfile(page);
		poHomeChannel = new HomeChannel(page);

		await page.goto('/account/security');
	});

	test.beforeAll(async ({ api }) => {
		const statusCode = (await api.post('/settings/E2E_Enable', { value: true })).status();

		expect(statusCode).toBe(200);
	});

	test.afterAll(async ({ api }) => {
		const statusCode = (await api.post('/settings/E2E_Enable', { value: false })).status();

		expect(statusCode).toBe(200);
	});

	test.afterEach(async ({ api }) => {
		await api.recreateContext();
	});

	test("expect reset user's e2e encryption key", async ({ page }) => {
		// Reset key to start the flow from the beginning
		// It will execute a logout
		await poAccountProfile.securityE2EEncryptionSection.click();
		await poAccountProfile.securityE2EEncryptionResetKeyButton.click();

		await page.locator('role=button[name="Login"]').waitFor();

		await injectInitialData();

		// Login again, check the banner to save the generated password and test it
		await restoreState(page, Users.admin);

		await page.locator('role=banner >> text="Save your encryption password"').click();

		password = (await page.evaluate(() => localStorage.getItem('e2e.randomPassword'))) || 'undefined';

		await expect(page.locator('#modal-root')).toContainText(password);

		await page.locator('#modal-root .rcx-button-group--align-end .rcx-button--primary').click();

		await expect(page.locator('role=banner >> text="Save your encryption password"')).not.toBeVisible();

		await poHomeChannel.sidenav.logout();

		await page.locator('role=button[name="Login"]').waitFor();

		await injectInitialData();

		await restoreState(page, Users.admin);

		await page.locator('role=banner >> text="Enter your E2E password"').click();

		await page.locator('#modal-root input').fill(password);

		await page.locator('#modal-root .rcx-button--primary').click();

		await expect(page.locator('role=banner >> text="Enter your E2E password"')).not.toBeVisible();

		await storeState(page, Users.admin);
	});

	test('expect change the e2ee password', async ({ page }) => {
		// Change the password to a new one and test it
		const newPassword = 'new password';

		await restoreState(page, Users.admin);

		await poAccountProfile.securityE2EEncryptionSection.click();
		await poAccountProfile.securityE2EEncryptionPassword.click();
		await poAccountProfile.securityE2EEncryptionPassword.fill(newPassword);
		await poAccountProfile.securityE2EEncryptionPasswordConfirmation.fill(newPassword);
		await poAccountProfile.securityE2EEncryptionSavePasswordButton.click();

		await poAccountProfile.btnClose.click();

		await poHomeChannel.sidenav.logout();

		await page.locator('role=button[name="Login"]').waitFor();

		await injectInitialData();

		await restoreState(page, Users.admin, { except: ['public_key', 'private_key'] });

		await page.locator('role=banner >> text="Enter your E2E password"').click();

		await page.locator('#modal-root input').fill(password);

		await page.locator('#modal-root .rcx-button--primary').click();

		await page.locator('role=banner >> text="Wasn\'t possible to decode your encryption key to be imported."').click();

		await page.locator('#modal-root input').fill(newPassword);

		await page.locator('#modal-root .rcx-button--primary').click();

		await expect(page.locator('role=banner >> text="Wasn\'t possible to decode your encryption key to be imported."')).not.toBeVisible();
		await expect(page.locator('role=banner >> text="Enter your E2E password"')).not.toBeVisible();
	});
});

test.describe.serial('e2e-encryption', () => {
	let poHomeChannel: HomeChannel;

	test.beforeEach(async ({ page, api }) => {
		const statusCode = (await api.post('/settings/E2E_Enable', { value: true })).status();

		expect(statusCode).toBe(200);

		poHomeChannel = new HomeChannel(page);
		await page.goto('/home');
	});

	test.beforeAll(async ({ api }) => {
		expect((await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: true })).status()).toBe(200);
	});

	test.afterAll(async ({ api }) => {
		expect((await api.post('/settings/E2E_Enable', { value: false })).status()).toBe(200);
		expect((await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: false })).status()).toBe(200);
	});

	test('expect create a private channel encrypted and send an encrypted message', async ({ page }) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await poHomeChannel.dismissToast();

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage('hello world');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();

		await poHomeChannel.tabs.kebab.click({ force: true });

		await expect(poHomeChannel.tabs.btnDisableE2E).toBeVisible();
		await poHomeChannel.tabs.btnDisableE2E.click({ force: true });
		await poHomeChannel.dismissToast();
		await page.waitForTimeout(1000);

		await poHomeChannel.content.sendMessage('hello world not encrypted');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world not encrypted');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).not.toBeVisible();

		await poHomeChannel.tabs.kebab.click({ force: true });
		await expect(poHomeChannel.tabs.btnEnableE2E).toBeVisible();
		await poHomeChannel.tabs.btnEnableE2E.click({ force: true });
		await poHomeChannel.dismissToast();
		await page.waitForTimeout(1000);

		await poHomeChannel.content.sendMessage('hello world encrypted again');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world encrypted again');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();
	});

	test('expect create a private channel, encrypt it and send an encrypted message', async ({ page }) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.openNewByLabel('Channel');
		await poHomeChannel.sidenav.inputChannelName.fill(channelName);
		await poHomeChannel.sidenav.btnCreate.click();

		await expect(page).toHaveURL(`/group/${channelName}`);

		await expect(poHomeChannel.toastSuccess).toBeVisible();

		await poHomeChannel.dismissToast();

		await poHomeChannel.tabs.kebab.click({ force: true });
		await expect(poHomeChannel.tabs.btnEnableE2E).toBeVisible();
		await poHomeChannel.tabs.btnEnableE2E.click({ force: true });
		await page.waitForTimeout(1000);

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage('hello world');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();
	});

	test('expect create a Direct message, encrypt it and attempt to enable OTR', async ({ page }) => {
		await poHomeChannel.sidenav.openNewByLabel('Direct message');
		await poHomeChannel.sidenav.inputDirectUsername.click();
		await page.keyboard.type('user2');
		await page.waitForTimeout(1000);
		await page.keyboard.press('Enter');
		await poHomeChannel.sidenav.btnCreate.click();

		await expect(page).toHaveURL(`/direct/rocketchat.internal.admin.testuser2`);

		await poHomeChannel.tabs.kebab.click({ force: true });
		await expect(poHomeChannel.tabs.btnEnableE2E).toBeVisible();
		await poHomeChannel.tabs.btnEnableE2E.click({ force: true });
		await page.waitForTimeout(1000);

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.dismissToast();

		await poHomeChannel.tabs.kebab.click({ force: true });
		await expect(poHomeChannel.tabs.btnEnableOTR).toBeVisible();
		await poHomeChannel.tabs.btnEnableOTR.click({ force: true });

		await expect(page.getByText('OTR not available')).toBeVisible();
	});

	test('expect placeholder text in place of encrypted message, when E2EE is not setup', async ({ page }) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await poHomeChannel.dismissToast();

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage('This is an encrypted message.');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('This is an encrypted message.');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();

		// Logout to remove e2ee keys
		await poHomeChannel.sidenav.logout();

		// Login again
		await page.locator('role=button[name="Login"]').waitFor();
		await injectInitialData();
		await restoreState(page, Users.admin, { except: ['private_key', 'public_key'] });

		await poHomeChannel.sidenav.openChat(channelName);

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await expect(poHomeChannel.content.lastUserMessage).toContainText(
			'This message is end-to-end encrypted. To view it, you must enter your encryption key in your account settings.',
		);
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();
	});

	test.describe('reset keys', () => {
		let anotherClientPage: Page;

		test.beforeEach(async ({ browser }) => {
			anotherClientPage = (await createAuxContext(browser, Users.admin)).page;
		});

		test.afterEach(async () => {
			await anotherClientPage.close();
		});
		test.afterAll(async () => {
			// inject initial data, so that tokens are restored after forced logout
			await injectInitialData();
		});

		test('expect force logout on e2e keys reset', async ({ page }) => {
			const poAccountProfile = new AccountProfile(page);
			// creating another logged in client, to check force logout

			await page.goto('/account/security');

			await poAccountProfile.securityE2EEncryptionSection.click();
			await poAccountProfile.securityE2EEncryptionResetKeyButton.click();

			await expect(page.locator('role=button[name="Login"]')).toBeVisible();
			await expect(anotherClientPage.locator('role=button[name="Login"]')).toBeVisible();

			// await expect(page.locator('role=banner')).toContainText('Your session was ended on this device, please log in again to continue.');
			// await expect(anotherClientPage.locator('role=banner')).toContainText(
			// 	'Your session was ended on this device, please log in again to continue.',
			// );
		});
	});
});

test.describe.serial('e2ee room setup', () => {
	let poAccountProfile: AccountProfile;
	let poHomeChannel: HomeChannel;
	let e2eePassword: string;

	test.beforeEach(async ({ page }) => {
		poAccountProfile = new AccountProfile(page);
		poHomeChannel = new HomeChannel(page);
	});

	test.beforeAll(async ({ api }) => {
		expect((await api.post('/settings/E2E_Enable', { value: true })).status()).toBe(200);
		expect((await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: false })).status()).toBe(200);
	});

	test.afterAll(async ({ api }) => {
		expect((await api.post('/settings/E2E_Enable', { value: false })).status()).toBe(200);
		expect((await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: false })).status()).toBe(200);
	});

	test('expect save password state on encrypted room', async ({ page }) => {
		await page.goto('/account/security');
		await poAccountProfile.securityE2EEncryptionSection.click();
		await poAccountProfile.securityE2EEncryptionResetKeyButton.click();

		await page.locator('role=button[name="Login"]').waitFor();

		await page.reload();

		await page.locator('role=button[name="Login"]').waitFor();

		await injectInitialData();
		await restoreState(page, Users.admin);

		await page.goto('/home');

		await page.locator('role=banner >> text="Save your encryption password"').waitFor();
		await expect(page.locator('role=banner >> text="Save your encryption password"')).toBeVisible();

		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.openNewByLabel('Channel');
		await poHomeChannel.sidenav.inputChannelName.fill(channelName);
		await poHomeChannel.sidenav.checkboxEncryption.click();
		await poHomeChannel.sidenav.btnCreate.click();

		await expect(page).toHaveURL(`/group/${channelName}`);

		await poHomeChannel.dismissToast();

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await page.locator('role=button[name="Save E2EE password"]').waitFor();
		await expect(page.locator('role=button[name="Save E2EE password"]')).toBeVisible();

		await expect(poHomeChannel.content.inputMessage).not.toBeVisible();

		await page.locator('role=button[name="Save E2EE password"]').click();

		e2eePassword = (await page.evaluate(() => localStorage.getItem('e2e.randomPassword'))) || 'undefined';

		await expect(page.locator('role=dialog[name="Save your encryption password"]')).toBeVisible();
		await expect(page.locator('#modal-root')).toContainText(e2eePassword);

		await page.locator('#modal-root >> button:has-text("I saved my password")').click();

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
		await page.reload();
		await page.locator('role=button[name="Login"]').waitFor();

		await injectInitialData();
		await restoreState(page, Users.admin, { except: ['private_key', 'public_key'] });

		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.openNewByLabel('Channel');
		await poHomeChannel.sidenav.inputChannelName.fill(channelName);
		await poHomeChannel.sidenav.checkboxEncryption.click();
		await poHomeChannel.sidenav.btnCreate.click();

		await expect(page).toHaveURL(`/group/${channelName}`);

		await poHomeChannel.dismissToast();

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await page.locator('role=button[name="Enter your E2E password"]').waitFor();

		await expect(page.locator('role=banner >> text="Enter your E2E password"')).toBeVisible();
		await expect(poHomeChannel.content.inputMessage).not.toBeVisible();

		await page.locator('role=button[name="Enter your E2E password"]').click();

		await page.locator('#modal-root input').fill(e2eePassword);

		await page.locator('#modal-root .rcx-button--primary').click();

		await expect(page.locator('role=banner >> text="Enter your E2E password"')).not.toBeVisible();

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

		await poHomeChannel.sidenav.openNewByLabel('Channel');
		await poHomeChannel.sidenav.inputChannelName.fill(channelName);
		await poHomeChannel.sidenav.checkboxEncryption.click();
		await poHomeChannel.sidenav.btnCreate.click();

		await expect(page).toHaveURL(`/group/${channelName}`);

		await poHomeChannel.dismissToast();

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage('hello world');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();

		await poHomeChannel.sidenav.userProfileMenu.click();
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

		await page.locator('role=button[name="Save E2EE password"]').click();
		await page.locator('#modal-root >> button:has-text("I saved my password")').click();

		await expect(poHomeChannel.content.inputMessage).not.toBeVisible();
		await expect(page.locator('.rcx-states__title')).toContainText('Check back later');
	});
});
