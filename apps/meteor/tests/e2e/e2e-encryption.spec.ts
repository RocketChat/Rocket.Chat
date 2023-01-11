import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { test, expect } from './utils/test';
import { AccountProfile, HomeChannel } from './page-objects';
import * as constants from './config/constants';

// OK Enable e2ee on admin
// OK Test banner and check password, logout and use password
// OK Set new password, logout and use the password
// OK Reset key, should logout, login and check banner
// OK Create channel encrypted and send message
// OK Disable encryption and send message
// OK Enable encryption and send message
// OK Create channel not encrypted, encrypt end send message

async function login(page: Page): Promise<void> {
	// TODO: Reuse code from global-setup.ts file
	await page.locator('[name=username]').type(constants.ADMIN_CREDENTIALS.email);
	await page.locator('[name=password]').type(constants.ADMIN_CREDENTIALS.password);
	await page.locator('role=button >> text="Login"').click();
	await page.waitForTimeout(1000);

	await page.context().storageState({ path: `admin-session.json` });
}

test.use({ storageState: 'admin-session.json' });

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

	test("expect reset user's e2e encryption key", async ({ page }) => {
		// Reset key to start the flow from the beginning
		// It will execute a logout
		await poAccountProfile.securityE2EEncryptionSection.click();
		await poAccountProfile.securityE2EEncryptionResetKeyButton.click();

		// Login again, check the banner to save the generated password and test it
		await login(page);
		await page.locator('role=banner >> text="Save Your Encryption Password"').click();

		password = (await page.evaluate(() => localStorage.getItem('e2e.randomPassword'))) || 'undefined';

		await expect(page.locator('#modal-root')).toContainText(password);

		await page.locator('#modal-root .rcx-button--primary').click();

		await expect(page.locator('role=banner >> text="Save Your Encryption Password"')).not.toBeVisible();

		await poHomeChannel.sidenav.logout();

		await login(page);

		await page.locator('role=banner >> text="Enter your E2E password"').click();

		await page.locator('#modal-root input').type(password);

		await page.locator('#modal-root .rcx-button--primary').click();

		await expect(page.locator('role=banner')).not.toBeVisible();

		// Store the generated key
		await page.context().storageState({ path: `admin-session.json` });
	});

	test('expect change the e2ee password', async ({ page }) => {
		// Change the password to a new one and test it
		const newPassword = 'new password';

		await poAccountProfile.securityE2EEncryptionSection.click();
		await poAccountProfile.securityE2EEncryptionPassword.click();
		await poAccountProfile.securityE2EEncryptionPassword.type(newPassword);
		await poAccountProfile.securityE2EEncryptionPasswordConfirmation.type(newPassword);
		await poAccountProfile.securityE2EEncryptionSavePasswordButton.click();

		await poAccountProfile.btnClose.click();

		await poHomeChannel.sidenav.logout();

		await login(page);

		await page.locator('role=banner >> text="Enter your E2E password"').click();

		await page.locator('#modal-root input').type(password);

		await page.locator('#modal-root .rcx-button--primary').click();

		await page.locator('role=banner >> text="Wasn\'t possible to decode your encryption key to be imported."').click();

		await page.locator('#modal-root input').type(newPassword);

		await page.locator('#modal-root .rcx-button--primary').click();

		await expect(page.locator('role=banner')).not.toBeVisible();

		// Store the current key
		await page.context().storageState({ path: `admin-session.json` });
	});
});

test.describe.serial('e2e-encryption', () => {
	let poHomeChannel: HomeChannel;

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
		// TODO: remove
		// await page.evaluate(() => localStorage.setItem('rc-config-debug', 'true'));
		// TODO: remove block
		// await page.locator('role=banner >> text="Enter your E2E password"').click();
		// await page.locator('#modal-root input').type('new password');
		// await page.locator('#modal-root .rcx-button--primary').click();
		// await expect(page.locator('role=banner')).not.toBeVisible();
	});

	test('expect create a private channel encrypted and send an encrypted message', async ({ page }) => {
		const channelName = faker.datatype.uuid();

		await poHomeChannel.sidenav.openNewByLabel('Channel');
		await poHomeChannel.sidenav.inputChannelName.type(channelName);
		await poHomeChannel.sidenav.checkboxEncryption.click({
			force: true,
		});
		await poHomeChannel.sidenav.btnCreate.click();

		await expect(page).toHaveURL(`/group/${channelName}`);

		await expect(poHomeChannel.toastSuccess).toBeVisible();

		await poHomeChannel.toastSuccess.locator('button >> i.rcx-icon--name-cross.rcx-icon').click();

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage('hello world');

		await expect(poHomeChannel.content.lastUserMessage.locator('p')).toHaveText('hello world');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();

		await poHomeChannel.tabs.kebab.click({ force: true });
		await expect(poHomeChannel.tabs.btnE2E).toBeVisible();
		await poHomeChannel.tabs.btnE2E.click({ force: true });
		await page.waitForTimeout(1000);

		await poHomeChannel.content.sendMessage('hello world not encrypted');

		await expect(poHomeChannel.content.lastUserMessage.locator('p')).toHaveText('hello world not encrypted');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).not.toBeVisible();

		await poHomeChannel.tabs.kebab.click({ force: true });
		await expect(poHomeChannel.tabs.btnE2E).toBeVisible();
		await poHomeChannel.tabs.btnE2E.click({ force: true });
		await page.waitForTimeout(1000);

		await poHomeChannel.content.sendMessage('hello world encrypted again');

		await expect(poHomeChannel.content.lastUserMessage.locator('p')).toHaveText('hello world encrypted again');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();
	});

	test('expect create a private channel, encrypt it and send an encrypted message', async ({ page }) => {
		const channelName = faker.datatype.uuid();

		await poHomeChannel.sidenav.openNewByLabel('Channel');
		await poHomeChannel.sidenav.inputChannelName.type(channelName);
		await poHomeChannel.sidenav.btnCreate.click();

		await expect(page).toHaveURL(`/group/${channelName}`);

		await expect(poHomeChannel.toastSuccess).toBeVisible();

		await poHomeChannel.toastSuccess.locator('button >> i.rcx-icon--name-cross.rcx-icon').click();

		await poHomeChannel.tabs.kebab.click({ force: true });
		await expect(poHomeChannel.tabs.btnE2E).toBeVisible();
		await poHomeChannel.tabs.btnE2E.click({ force: true });
		await page.waitForTimeout(1000);

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage('hello world');

		await expect(poHomeChannel.content.lastUserMessage.locator('p')).toHaveText('hello world');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();
	});
});
