import { faker } from '@faker-js/faker';

import { test, expect } from './utils/test';
import { HomeChannel, AccountProfile } from './page-objects';

test.use({ storageState: 'admin-session.json' });

test.describe.serial('settings-account-profile', () => {
	let poHomeChannel: HomeChannel;
	let poAccountProfile: AccountProfile;

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		poAccountProfile = new AccountProfile(page);

		await page.goto('/home');
	});

	test('expect update profile with new name/username', async () => {
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
});
