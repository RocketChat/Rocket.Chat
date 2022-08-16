import { faker } from '@faker-js/faker';

import { test, expect } from './utils/test';
import { HomeChannel, AccountProfile } from './page-objects';

test.use({ storageState: 'user3-session.json' });

test.describe.serial('settings-account-profile', () => {
	let poHomeChannel: HomeChannel;
	let poAccountProfile: AccountProfile;

	const token = faker.random.alpha(10);

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		poAccountProfile = new AccountProfile(page);

		await page.goto('/home');
	});

	// FIXME: solve test intermitencies
	test.skip('expect update profile with new name/username', async () => {
		const newName = faker.name.findName();
		const newUsername = faker.internet.userName(newName);

		await poHomeChannel.sidenav.goToMyAccount();
		await poAccountProfile.inputName.fill(newName);
		await poAccountProfile.inputUsername.fill(newUsername);
		await poAccountProfile.btnSubmit.click();
		await poAccountProfile.btnClose.click();
		await poHomeChannel.sidenav.openChat('general');
		await poHomeChannel.content.sendMessage('any_message');

		await expect(poHomeChannel.content.lastUserMessageNotSequential).toContainText(newUsername);

		await poHomeChannel.content.lastUserMessageNotSequential.locator('figure').click();
		await poHomeChannel.content.linkUserCard.click();

		await expect(poHomeChannel.tabs.userInfoUsername).toHaveText(newUsername);
	});

	test.describe('Personal Access Tokens', () => {
		test.beforeEach(async () => {
			await poHomeChannel.sidenav.goToMyAccount();
			await poAccountProfile.sidenav.linkTokens.click();
		});

		test('expect show empty personal access tokens table', async () => {
			await expect(poAccountProfile.tokensTableEmpty).toBeVisible();
			await expect(poAccountProfile.inputToken).toBeVisible();
		});

		test('expect show new personal token', async () => {
			await poAccountProfile.inputToken.type(token);
			await poAccountProfile.btnTokensAdd.click();
			await expect(poAccountProfile.tokenAddedModal).toBeVisible();
		});

		test('expect not allow add new personal token with same name', async ({ page }) => {
			await poAccountProfile.inputToken.type(token);
			await poAccountProfile.btnTokensAdd.click();
			await expect(page.locator('.rcx-toastbar.rcx-toastbar--error')).toBeVisible();
		});

		test('expect regenerate personal token', async () => {
			await poAccountProfile.tokenInTable(token).locator('button >> nth=0').click();
			await poAccountProfile.btnRegenerateTokenModal.click();
			await expect(poAccountProfile.tokenAddedModal).toBeVisible();
		});

		test('expect delete personal token', async ({ page }) => {
			await poAccountProfile.tokenInTable(token).locator('button >> nth=1').click();
			await poAccountProfile.btnRemoveTokenModal.click();
			await expect(page.locator('.rcx-toastbar.rcx-toastbar--success')).toBeVisible();
		});
	});

	test.describe('Change avatar', () => {
		test.beforeEach(async () => {
			await poHomeChannel.sidenav.goToMyAccount();
		});

		test('expect change avatar image by upload', async ({ page }) => {
			await poAccountProfile.inputImageFile.setInputFiles('./tests/e2e/fixtures/files/test-image.jpeg');

			await poAccountProfile.btnSubmit.click();
			await expect(page.locator('.rcx-toastbar.rcx-toastbar--success').first()).toBeVisible();
		});

		test('expect set image from url', async ({ page }) => {
			await poAccountProfile.inputAvatarLink.fill('https://www.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50');
			await poAccountProfile.btnSetAvatarLink.click();

			await poAccountProfile.btnSubmit.click();
			await expect(page.locator('.rcx-toastbar.rcx-toastbar--success').first()).toBeVisible();
		});
	});
});
