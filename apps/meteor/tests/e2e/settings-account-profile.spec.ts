import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

import { HomeChannel, AccountProfile } from './page-objects';

test.use({ storageState: 'session-admin.json' });

test.describe.parallel('settings-account-profile', () => {
    let poHomeChannel: HomeChannel;
    let poAccountProfile: AccountProfile;

    test.beforeEach(async ({ page }) => {
        poHomeChannel = new HomeChannel(page);
        poAccountProfile = new AccountProfile(page);

        await page.goto('/home')
    })

    test('expect update profile with new name and username', async () => {
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
    })
});
