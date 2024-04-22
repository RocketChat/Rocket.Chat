import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { createAuxContext } from './fixtures/createAuxContext';
import injectInitialData from './fixtures/inject-initial-data';
import { Users, storeState, restoreState } from './fixtures/userStates';
import { AccountProfile, HomeChannel } from './page-objects';
import { test, expect } from './utils/test';

// OK Enable e2ee on admin
// OK Test banner and check password, logout and use password
// OK Set new password, logout and use the password
// OK Reset key, should logout, login and check banner
// OK Create channel encrypted and send message
// OK Disable encryption and send message
// OK Enable encryption and send message
// OK Create channel not encrypted, encrypt end send message

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

		await page.locator('#modal-root input').type(password);

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
		await poAccountProfile.securityE2EEncryptionPassword.type(newPassword);
		await poAccountProfile.securityE2EEncryptionPasswordConfirmation.type(newPassword);
		await poAccountProfile.securityE2EEncryptionSavePasswordButton.click();

		await poAccountProfile.btnClose.click();

		await poHomeChannel.sidenav.logout();

		await page.locator('role=button[name="Login"]').waitFor();

		await injectInitialData();

		await restoreState(page, Users.admin, { except: ['public_key', 'private_key'] });

		await page.locator('role=banner >> text="Enter your E2E password"').click();

		await page.locator('#modal-root input').type(password);

		await page.locator('#modal-root .rcx-button--primary').click();

		await page.locator('role=banner >> text="Wasn\'t possible to decode your encryption key to be imported."').click();

		await page.locator('#modal-root input').type(newPassword);

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

	test.afterAll(async ({ api }) => {
		const statusCode = (await api.post('/settings/E2E_Enable', { value: false })).status();

		await expect(statusCode).toBe(200);
	});

	test('expect create a private channel encrypted and send an encrypted message', async ({ page }) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.openNewByLabel('Channel');
		await poHomeChannel.sidenav.inputChannelName.type(channelName);
		await poHomeChannel.sidenav.checkboxEncryption.click();
		await poHomeChannel.sidenav.btnCreate.click();

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
		await poHomeChannel.sidenav.inputChannelName.type(channelName);
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

	test('expect create a private encrypted channel and send an attachment with encrypted file description', async ({ page }) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.openNewByLabel('Channel');
		await poHomeChannel.sidenav.inputChannelName.fill(channelName);
		await poHomeChannel.sidenav.checkboxEncryption.click();
		await poHomeChannel.sidenav.btnCreate.click();

		await expect(page).toHaveURL(`/group/${channelName}`);

		await poHomeChannel.dismissToast();

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.dragAndDropTxtFile();
		await poHomeChannel.content.descriptionInput.fill('any_description');
		await poHomeChannel.content.fileNameInput.fill('any_file1.txt');
		await poHomeChannel.content.btnModalConfirm.click();

		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();

		await expect(poHomeChannel.content.getFileDescription).toHaveText('any_description');
		await expect(poHomeChannel.content.lastMessageFileName).toContainText('any_file1.txt');
	});

	test('expect create a private encrypted channel and send an attachment with encrypted file description in a thread message', async ({
		page,
	}) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.openNewByLabel('Channel');
		await poHomeChannel.sidenav.inputChannelName.fill(channelName);
		await poHomeChannel.sidenav.checkboxEncryption.click();
		await poHomeChannel.sidenav.btnCreate.click();

		await expect(page).toHaveURL(`/group/${channelName}`);

		await poHomeChannel.dismissToast();

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage('This is a thread main message.');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('This is a thread main message.');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();

		await page.locator('[data-qa-type="message"]').last().hover();
		await page.locator('role=button[name="Reply in thread"]').click();

		await expect(page).toHaveURL(/.*thread/);

		await poHomeChannel.content.dragAndDropTxtFileToThread();
		await poHomeChannel.content.descriptionInput.fill('any_description');
		await poHomeChannel.content.fileNameInput.fill('any_file1.txt');
		await poHomeChannel.content.btnModalConfirm.click();

		await expect(poHomeChannel.content.lastThreadMessageFileDescription).toHaveText('any_description');
		await expect(poHomeChannel.content.lastThreadMessageFileName).toContainText('any_file1.txt');
	});

	test('expect placeholder text in place of encrypted message, when E2EE is not setup', async ({ page }) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.openNewByLabel('Channel');
		await poHomeChannel.sidenav.inputChannelName.fill(channelName);
		await poHomeChannel.sidenav.checkboxEncryption.click();
		await poHomeChannel.sidenav.btnCreate.click();

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

	test('expect placeholder text in place of encrypted file description, when E2EE is not setup', async ({ page }) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.openNewByLabel('Channel');
		await poHomeChannel.sidenav.inputChannelName.fill(channelName);
		await poHomeChannel.sidenav.checkboxEncryption.click();
		await poHomeChannel.sidenav.btnCreate.click();

		await expect(page).toHaveURL(`/group/${channelName}`);

		await poHomeChannel.dismissToast();

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.dragAndDropTxtFile();
		await poHomeChannel.content.descriptionInput.fill('any_description');
		await poHomeChannel.content.fileNameInput.fill('any_file1.txt');
		await poHomeChannel.content.btnModalConfirm.click();

		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();

		await expect(poHomeChannel.content.getFileDescription).toHaveText('any_description');
		await expect(poHomeChannel.content.lastMessageFileName).toContainText('any_file1.txt');

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
