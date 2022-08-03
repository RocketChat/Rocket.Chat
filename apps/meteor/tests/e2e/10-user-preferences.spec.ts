import { faker } from '@faker-js/faker';

import { test, expect } from './utils/test';
import { Auth, HomeChannel, AccountProfile } from './page-objects';

test.describe('My Account', () => {
	let pageAuth: Auth;
	let pageHomeChannel: HomeChannel;
	let pageAccountProfile: AccountProfile;

	const newName = faker.name.findName();
	const newUsername = faker.internet.userName(newName);

	const token = faker.random.alpha(10);

	test.beforeEach(async ({ page }) => {
		pageAuth = new Auth(page);
		pageHomeChannel = new HomeChannel(page);
		pageAccountProfile = new AccountProfile(page);
	});

	test.describe('User Profile', () => {
		test.beforeEach(async () => {
			await pageAuth.doLogin();
		});

		test('expect update profile with new name and username', async ({ page }) => {
			await pageHomeChannel.sidenav.doOpenProfile();

			await pageAccountProfile.inputName.fill(newName);
			await pageAccountProfile.inputUsername.fill(newUsername);
			await pageAccountProfile.btnSubmit.click();
			await page.goto('/');
		});

		test('expect show new username in the last message', async () => {
			await pageHomeChannel.sidenav.doOpenChat('general');
			await pageHomeChannel.content.doSendMessage('any_message');

			await expect(pageHomeChannel.content.lastUserMessageNotSequential).toContainText(newUsername);
		});

		test('expect show new username in card and profile', async () => {
			await pageHomeChannel.sidenav.doOpenChat('general');
			await pageHomeChannel.content.doSendMessage('any_message');

			await pageHomeChannel.content.lastUserMessageNotSequential.locator('figure').click();
			await pageHomeChannel.content.userCardLinkProfile.click();

			await expect(pageHomeChannel.tabs.userInfoUsername).toHaveText(newUsername);
		});
	});

	test.describe('Personal Access Tokens', () => {
		test.beforeEach(async () => {
			await pageAuth.doLogin();
			await pageHomeChannel.sidenav.doOpenProfile();
			await pageAccountProfile.sidenav.linkTokens.click();
		});

		test('expect show empty personal access tokens table', async () => {
			await expect(pageAccountProfile.tokensTableEmpty).toBeVisible();
			await expect(pageAccountProfile.inputToken).toBeVisible();
		});

		test('expect show new personal token', async () => {
			await pageAccountProfile.inputToken.type(token);
			await pageAccountProfile.btnTokensAdd.click();
			await expect(pageAccountProfile.tokenAddedModal).toBeVisible();
		});

		test('expect not allow add new personal token with same name', async ({ page }) => {
			await pageAccountProfile.inputToken.type(token);
			await pageAccountProfile.btnTokensAdd.click();
			await expect(page.locator('.rcx-toastbar.rcx-toastbar--error')).toBeVisible();
		});

		test('expect regenerate personal token', async () => {
			await pageAccountProfile.tokenInTable(token).locator('button >> nth=0').click();
			await pageAccountProfile.btnRegenerateTokenModal.click();
			await expect(pageAccountProfile.tokenAddedModal).toBeVisible();
		});

		test('expect delete personal token', async ({ page }) => {
			await pageAccountProfile.tokenInTable(token).locator('button >> nth=1').click();
			await pageAccountProfile.btnRemoveTokenModal.click();
			await expect(page.locator('.rcx-toastbar.rcx-toastbar--success')).toBeVisible();
		});
	});
});
