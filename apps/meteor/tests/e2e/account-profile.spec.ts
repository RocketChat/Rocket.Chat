import AxeBuilder from '@axe-core/playwright';
import { faker } from '@faker-js/faker';
import type { BrowserContext, Page } from 'playwright-core';

import { Users } from './fixtures/userStates';
import { HomeChannel, AccountProfile } from './page-objects';
import { test, expect } from './utils/test';

test.use({ storageState: Users.user3.state });

test.describe.serial('settings-account-profile', () => {
	let poHomeChannel: HomeChannel;
	let poAccountProfile: AccountProfile;
	let page: Page;
	let context: BrowserContext;

	const token = faker.string.alpha(10);
	const axe = () =>
		new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
			.include('body')
			.disableRules(['aria-hidden-focus', 'nested-interactive']);

	test.beforeAll(async ({ browser }) => {
		context = await browser.newContext({ storageState: Users.user3.state });
		page = await context.newPage();
		poHomeChannel = new HomeChannel(page);
		poAccountProfile = new AccountProfile(page);
	});

	test.afterAll(async () => {
		await page.close();
		await context.close();
	});

	// FIXME: solve test intermitencies
	test.describe('Profile', () => {
		test.beforeEach(async () => {
			await page.goto('/account/profile');
		});

		test.skip('expect update profile with new name/username', async () => {
			const newName = faker.person.fullName();
			const newUsername = faker.internet.userName({ firstName: newName });

			await poAccountProfile.inputName.fill(newName);
			await poAccountProfile.inputUsername.fill(newUsername);
			await poAccountProfile.btnSubmit.click();
			await poAccountProfile.btnClose.click();
			await poHomeChannel.navbar.openChat('general');
			await poHomeChannel.content.sendMessage('any_message');

			await expect(poHomeChannel.content.lastUserMessageNotSequential).toContainText(newUsername);

			await poHomeChannel.content.lastUserMessageNotSequential.locator('figure').click();
			await poHomeChannel.userCard.openUserInfo();

			await expect(poHomeChannel.tabs.userInfo.username).toHaveText(newUsername);
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

			test('should show inline error if the image url is not valid', async () => {
				await poAccountProfile.inputAvatarLink.fill('https://invalidUrl');
				await poAccountProfile.btnSetAvatarLink.click();

				await expect(poAccountProfile.errorInvalidUrl).toBeVisible();
			});

			test('should show inline error if url does not point to an image', async () => {
				await poAccountProfile.inputAvatarLink.fill('https://google.com');
				await poAccountProfile.btnSetAvatarLink.click();

				await expect(poAccountProfile.errorInvalidUrl).toBeVisible();
			});
		});
	});

	test('Personal Access Tokens', async () => {
		await Promise.all([page.waitForResponse('**/api/v1/users.getPersonalAccessTokens'), page.goto('/account/tokens')]);

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

		await test.step('should not allow add new personal with no name', async () => {
			await poAccountProfile.btnTokensAdd.click();
			await expect(page.getByRole('alert').filter({ hasText: 'Please provide a name for your token' })).toBeVisible();
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
		test('should not have any accessibility violations', async () => {
			await page.goto('/account/omnichannel');

			const results = await axe().analyze();
			expect(results.violations).toEqual([]);
		});
	});

	test.describe('Feature Preview', () => {
		test('should not have any accessibility violations', async () => {
			await page.goto('/account/feature-preview');

			const results = await axe().analyze();
			expect(results.violations).toEqual([]);
		});
	});

	test.describe('Accessibility & Appearance', () => {
		test('should not have any accessibility violations', async () => {
			await page.goto('/account/accessibility-and-appearance');

			const results = await axe().analyze();
			expect(results.violations).toEqual([]);
		});
	});
});
