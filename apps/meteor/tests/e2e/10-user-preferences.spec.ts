import { faker } from '@faker-js/faker';

import { test, expect } from './utils/test';
import { Auth, HomeChannel, AccountProfile } from './page-objects';

test.describe('User preferences', () => {
	let pageAuth: Auth;
	let pageHomeChannel: HomeChannel;
	let pageAccountProfile: AccountProfile;

	const newName = faker.name.findName();
	const newUsername = faker.internet.userName(newName);

	test.beforeEach(async ({ page }) => {
		pageAuth = new Auth(page);
		pageHomeChannel = new HomeChannel(page);
		pageAccountProfile = new AccountProfile(page);
	});

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
