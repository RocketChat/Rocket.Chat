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
		})

		test.skip('expect update profile with new name/username', async () => {
			test.fail()
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
		})

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
		})
	});

	test.describe('Security', () => {
		test('should not have any accessibility violations', async ({ page, makeAxeBuilder }) => {
			await page.goto('/account/security');

			const results = await makeAxeBuilder().analyze();
			expect(results.violations).toEqual([]);
		})
	})

	test('Personal Access Tokens', async ({ page }) => {
		const response = page.waitForResponse('**/api/v1/users.getPersonalAccessTokens');
		await page.goto('/account/tokens');
		await response;

		await test.step('expect show empty personal access tokens table', async () => {
			await expect(poAccountProfile.tokensTableEmpty).toBeVisible();
			await expect(poAccountProfile.inputToken).toBeVisible();
		});

		await test.step('expect show new personal token', async () => {
			await poAccountProfile.inputToken.type(token);
			await poAccountProfile.btnTokensAdd.click();
			await expect(poAccountProfile.tokenAddedModal).toBeVisible();
			await page.locator('role=button[name=Ok]').click();
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
			await page.locator('role=button[name=Ok]').click();
		});

		await test.step('expect delete personal token', async () => {
			await poAccountProfile.tokenInTable(token).locator('button >> nth=1').click();
			await poAccountProfile.btnRemoveTokenModal.click();
			await expect(page.locator('.rcx-toastbar.rcx-toastbar--success')).toBeVisible();
		});
	});

	test.describe('Omnichannel', () => {
		test('should not have any accessibility violations', async ({ page, makeAxeBuilder }) => {
			await page.goto('/account/omnichannel');

			const results = await makeAxeBuilder().analyze();
			expect(results.violations).toEqual([]);
		})
	})

	test.describe('Feature Preview', () => {
		test('should not have any accessibility violations', async ({ page, makeAxeBuilder }) => {
			await page.goto('/account/feature-preview');

			const results = await makeAxeBuilder().analyze();
			expect(results.violations).toEqual([]);
		})
	})

	test.describe('Accessibility & Appearance', () => {
		test('should not have any accessibility violations', async ({ page, makeAxeBuilder }) => {
			await page.goto('/account/accessibility-and-appearance');

			const results = await makeAxeBuilder().analyze();
			expect(results.violations).toEqual([]);
		})
	})
});


