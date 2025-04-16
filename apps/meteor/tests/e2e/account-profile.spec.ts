import { faker } from '@faker-js/faker';

import { Users } from './fixtures/userStates';
import { HomeChannel, AccountProfile } from './page-objects';
import { test, expect } from './utils/test';

test.use({ storageState: Users.user3.state });

test.describe.serial('settings-account-profile', () => {
	let poHomeChannel: HomeChannel;
	let poAccountProfile: AccountProfile;

	const token = faker.string.alpha(10);

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		poAccountProfile = new AccountProfile(page);
	});

	// FIXME: solve test intermitencies
	test.describe('Profile', () => {
		test.beforeEach(async ({ page }) => {
			await page.goto('/account/profile');
		});

		test.skip('expect update profile with new name/username', async () => {
			const newName = faker.person.fullName();
			const newUsername = faker.internet.userName({ firstName: newName });

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

		test.describe('Avatar', () => {
			test('should change avatar image by uploading file', async () => {
				await poAccountProfile.inputImageFile.setInputFiles('./tests/e2e/fixtures/files/test-image.jpeg');
				await poAccountProfile.btnSubmit.click();

				await expect(poAccountProfile.userAvatarEditor).toHaveAttribute('src');
			});

			test('should change avatar image from url', async () => {
				await poAccountProfile.inputAvatarLink.fill('https://www.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50');
				await poAccountProfile.btnSetAvatarLink.click();

				await poAccountProfile.btnSubmit.click();
				await expect(poAccountProfile.userAvatarEditor).toHaveAttribute('src');
			});

			test('should display a skeleton if the image url is not valid', async () => {
				await poAccountProfile.inputAvatarLink.fill('https://invalidUrl');
				await poAccountProfile.btnSetAvatarLink.click();

				await poAccountProfile.btnSubmit.click();
				await expect(poAccountProfile.userAvatarEditor).not.toHaveAttribute('src');
			});
		});
	});

	test.describe('Security', () => {
		test.beforeEach(async ({ page }) => {
			await page.goto('account/security');
			await page.waitForSelector('.main-content');
		});

		test('should not have any accessibility violations', async ({ page, makeAxeBuilder }) => {
			await page.goto('/account/security');

			const results = await makeAxeBuilder().analyze();
			expect(results.violations).toEqual([]);
		});

		test('should disable and enable email 2FA', async () => {
			await poAccountProfile.security2FASection.click();
			await expect(poAccountProfile.email2FASwitch).toBeVisible();
			await poAccountProfile.email2FASwitch.click();
			await expect(poHomeChannel.toastSuccess).toBeVisible();
			await poHomeChannel.dismissToast();

			await poAccountProfile.email2FASwitch.click();
			await expect(poHomeChannel.toastSuccess).toBeVisible();
		});
	});

	test('Personal Access Tokens', async ({ page }) => {
		const response = page.waitForResponse('**/api/v1/users.getPersonalAccessTokens');
		await page.goto('/account/tokens');
		await response;

		await test.step('should show empty personal access tokens table', async () => {
			await expect(poAccountProfile.tokensTableEmpty).toBeVisible();
			await expect(poAccountProfile.inputToken).toBeVisible();
		});

		await test.step('should show new personal token', async () => {
			await poAccountProfile.inputToken.fill(token);
			await poAccountProfile.btnTokensAdd.click();
			await expect(poAccountProfile.tokenAddedModal).toBeVisible();
			await poAccountProfile.btnTokenAddedOk.click();
		});

		await test.step('should not allow add new personal token with same name', async () => {
			await poAccountProfile.inputToken.fill(token);
			await poAccountProfile.btnTokensAdd.click();
			await expect(poAccountProfile.tokensRows).toHaveCount(1);
		});

		await test.step('should regenerate personal token', async () => {
			await poAccountProfile.tokenInTable(token).locator('button >> nth=0').click();
			await poAccountProfile.btnRegenerateTokenModal.click();
			await expect(poAccountProfile.tokenAddedModal).toBeVisible();
			await poAccountProfile.btnTokenAddedOk.click();
		});

		await test.step('should delete personal token', async () => {
			await poAccountProfile.tokenInTable(token).locator('button >> nth=1').click();
			await poAccountProfile.btnRemoveTokenModal.click();
			await expect(poAccountProfile.tokensTableEmpty).toBeVisible();
		});
	});

	test.describe('Omnichannel', () => {
		test('should not have any accessibility violations', async ({ page, makeAxeBuilder }) => {
			await page.goto('/account/omnichannel');

			const results = await makeAxeBuilder().analyze();
			expect(results.violations).toEqual([]);
		});
	});

	test.describe('Feature Preview', () => {
		test('should not have any accessibility violations', async ({ page, makeAxeBuilder }) => {
			await page.goto('/account/feature-preview');

			const results = await makeAxeBuilder().analyze();
			expect(results.violations).toEqual([]);
		});
	});

	test.describe('Accessibility & Appearance', () => {
		test('should not have any accessibility violations', async ({ page, makeAxeBuilder }) => {
			await page.goto('/account/accessibility-and-appearance');

			const results = await makeAxeBuilder().analyze();
			expect(results.violations).toEqual([]);
		});
	});
});
