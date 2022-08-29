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
	test.skip('expect update profile with new name/username', async ({ page }) => {
		const newName = faker.name.findName();
		const newUsername = faker.internet.userName(newName);

		await page.goto('/account/profile');
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

	test('Personal Access Tokens', async ({ page }) => {
		await page.goto('/account/tokens');

		await test.step('expect show empty personal access tokens table', async () => {
			await expect(poAccountProfile.tokensTableEmpty).toBeVisible();
			await expect(poAccountProfile.inputToken).toBeVisible();
		});

		await test.step('expect show new personal token', async () => {
			await poAccountProfile.inputToken.type(token);
			await poAccountProfile.btnTokensAdd.click();
			await expect(poAccountProfile.tokenAddedModal).toBeVisible();
			await page.locator('button:has-text("Ok")').click();
		});

		await test.step('expect not allow add new personal token with same name', async () => {
			await poAccountProfile.inputToken.type(token);
			await poAccountProfile.btnTokensAdd.click();
			await expect(page.locator('.rcx-toastbar.rcx-toastbar--error')).toBeVisible();
		});

		await test.step('expect regenerate personal token', async () => {
			await poAccountProfile.tokenInTable(token).locator('button >> nth=0').click();
			await poAccountProfile.btnRegenerateTokenModal.click();
			await expect(poAccountProfile.tokenAddedModal).toBeVisible();
			await page.locator('button:has-text("Ok")').click();
		});

		await test.step('expect delete personal token', async () => {
			await poAccountProfile.tokenInTable(token).locator('button >> nth=1').click();
			await poAccountProfile.btnRemoveTokenModal.click();
			await expect(page.locator('.rcx-toastbar.rcx-toastbar--success')).toBeVisible();
		});
	});

	test('change avatar', async ({ page }) => {
		await page.goto('/account/profile');

		await test.step('expect change avatar image by upload', async () => {
			await poAccountProfile.inputImageFile.setInputFiles('./tests/e2e/fixtures/files/test-image.jpeg');

			await poAccountProfile.btnSubmit.click();
			await expect(page.locator('.rcx-toastbar.rcx-toastbar--success').first()).toBeVisible();
		});

		await test.step('expect to close toastbar', async () => {
			await page.locator('.rcx-toastbar.rcx-toastbar--success').first().click();
		});

		await test.step('expect set image from url', async () => {
			await poAccountProfile.inputAvatarLink.fill('https://www.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50');
			await poAccountProfile.btnSetAvatarLink.click();

			await poAccountProfile.btnSubmit.click();
			await expect(page.locator('.rcx-toastbar.rcx-toastbar--success').first()).toBeVisible();
		});
	});
});
