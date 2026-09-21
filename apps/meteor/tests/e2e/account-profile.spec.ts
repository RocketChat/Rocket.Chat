import { faker } from '@faker-js/faker';

import { Users } from './fixtures/userStates';
import {
	AccountAccessibility,
	AccountFeaturePreview,
	AccountOmnichannel,
	AccountProfile,
	AccountTokens,
	HomeChannel,
} from './page-objects';
import { setSettingValueById } from './utils/setSettingValueById';
import { setUserPhones } from './utils/setUserPhones';
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

	test.describe('Profile', () => {
		test.beforeEach(async () => {
			await poAccountProfile.goto();
		});

		// FIXME: solve test intermitencies
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

			test('should not allow avatar URL change when avatar changes are disabled', async ({ api }) => {
				await setSettingValueById(api, 'Accounts_AllowUserAvatarChange', false);
				await expect(poAccountProfile.btnSetAvatarLink).toBeDisabled();
				await expect(poAccountProfile.inputAvatarLink).toBeDisabled();
				await setSettingValueById(api, 'Accounts_AllowUserAvatarChange', true);
			});
		});

		test.describe('Phones', () => {
			test.beforeEach(async ({ api, page }) => {
				await setUserPhones(api, Users.user3.data._id, []);
				await page.reload();
			});

			test.afterEach(async ({ api }) => {
				await setUserPhones(api, Users.user3.data._id, []);
			});

			test('should add and persist multiple phones on account profile', async ({ page }) => {
				await expect(poAccountProfile.phoneNumber.inputPhoneNumber).toHaveCount(0);
				await poAccountProfile.phoneNumber.addPhone('+15554440001', 'Work');
				await poAccountProfile.phoneNumber.addPhone('+15554440002', 'Home');

				await poAccountProfile.btnSaveChanges.click();
				await poAccountProfile.toastMessage.dismissToast();

				await page.reload();

				await expect(poAccountProfile.phoneNumber.inputPhoneNumber).toHaveCount(2);
				await expect(poAccountProfile.phoneNumber.getPhoneNumberInput(0)).toHaveValue('+15554440001');
				await expect(poAccountProfile.phoneNumber.getPhoneLabelInput(0)).toHaveValue('Work');
				await expect(poAccountProfile.phoneNumber.getPhoneNumberInput(1)).toHaveValue('+15554440002');
				await expect(poAccountProfile.phoneNumber.getPhoneLabelInput(1)).toHaveValue('Home');
			});

			test('should remove a phone on account profile and persist result', async ({ api, page }) => {
				await setUserPhones(api, Users.user3.data._id, [
					{ number: '+15554440001', label: 'Work' },
					{ number: '+15554440002', label: 'Home' },
				]);

				await page.reload();

				await poAccountProfile.phoneNumber.removePhone(0);
				await poAccountProfile.btnSaveChanges.click();
				await poAccountProfile.toastMessage.dismissToast();

				await page.reload();

				await expect(poAccountProfile.phoneNumber.inputPhoneNumber).toHaveCount(1);
				await expect(poAccountProfile.phoneNumber.getPhoneNumberInput(0)).toHaveValue('+15554440002');
				await expect(poAccountProfile.phoneNumber.getPhoneLabelInput(0)).toHaveValue('Home');
			});
		});
	});

	test('Personal Access Tokens', async ({ page }) => {
		const poAccountTokens = new AccountTokens(page);
		const response = page.waitForResponse('**/api/v1/users.getPersonalAccessTokens');
		await poAccountTokens.goto();
		await response;

		await test.step('should show empty personal access tokens table', async () => {
			await expect(poAccountTokens.tokensTableEmpty).toBeVisible();
			await expect(poAccountTokens.inputToken).toBeVisible();
		});

		await test.step('should show new personal token', async () => {
			await poAccountTokens.inputToken.fill(token);
			await poAccountTokens.btnTokensAdd.click();
			await expect(poAccountTokens.tokenAddedModal).toBeVisible();
			await poAccountTokens.btnTokenAddedOk.click();
		});

		await test.step('should not allow add new personal with no name', async () => {
			await poAccountTokens.btnTokensAdd.click();
			await expect(page.getByRole('alert').filter({ hasText: 'Please provide a name for your token' })).toBeVisible();
		});

		await test.step('should not allow add new personal token with same name', async () => {
			await poAccountTokens.inputToken.fill(token);
			await poAccountTokens.btnTokensAdd.click();
			await expect(poAccountTokens.tokensRows).toHaveCount(1);
		});

		await test.step('should regenerate personal token', async () => {
			await poAccountTokens.tokenInTable(token).locator('button >> nth=0').click();
			await poAccountTokens.btnRegenerateTokenModal.click();
			await expect(poAccountTokens.tokenAddedModal).toBeVisible();
			await poAccountTokens.btnTokenAddedOk.click();
		});

		await test.step('should delete personal token', async () => {
			await poAccountTokens.tokenInTable(token).locator('button >> nth=1').click();
			await poAccountTokens.btnRemoveTokenModal.click();
			await expect(poAccountTokens.tokensTableEmpty).toBeVisible();
		});
	});

	test.describe('Omnichannel', () => {
		test('should not have any accessibility violations', async ({ page, makeAxeBuilder }) => {
			await new AccountOmnichannel(page).goto();

			const results = await makeAxeBuilder().analyze();
			expect(results.violations).toEqual([]);
		});
	});

	test.describe('Feature Preview', () => {
		test('should not have any accessibility violations', async ({ page, makeAxeBuilder }) => {
			await new AccountFeaturePreview(page).goto();

			const results = await makeAxeBuilder().analyze();
			expect(results.violations).toEqual([]);
		});
	});

	test.describe('Accessibility & Appearance', () => {
		test('should not have any accessibility violations', async ({ page, makeAxeBuilder }) => {
			await new AccountAccessibility(page).goto();

			const results = await makeAxeBuilder().analyze();
			expect(results.violations).toEqual([]);
		});
	});
});
