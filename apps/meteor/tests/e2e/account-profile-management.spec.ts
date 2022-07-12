import { Page, test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

import { Auth, HomeChannel, AccountProfile } from './page-objects';

test.describe('Profile Management', () => {
	let page: Page;
	let pageAuth: Auth;
	let pageHomeChannel: HomeChannel;
	let pageAccountProfile: AccountProfile;

	let newName: string;
	let newUsername: string;

	test.beforeAll(async ({ browser }) => {
		page = await browser.newPage();
		pageAuth = new Auth(page);
		pageHomeChannel = new HomeChannel(page);
		pageAccountProfile = new AccountProfile(page);

		newName = faker.name.findName();
		newUsername = faker.internet.userName(newName);
	});

	test.beforeAll(async () => {
		await pageAuth.doLogin();
	});

	test('expect update profile with new name and username', async () => {
		await pageHomeChannel.sidebar.doOpenProfile();

		await pageAccountProfile.inputName.fill(newName);
		await pageAccountProfile.inputUsername.fill(newUsername);
		await pageAccountProfile.btnSubmit.click();
	});

	test('expect send a message as new user', async () => {
		await page.goto('/');
		await pageHomeChannel.sidebar.doOpenChat('general');
		await pageHomeChannel.content.doSendMessage('any_message');
	});

	test('expect show new username in the last message', async () => {
		await expect(pageHomeChannel.content.getUserMessage(newUsername)).toContainText(newUsername);
	});

	test('expect show new username in card and profile', async () => {
		await pageHomeChannel.content.getUserFigure(newUsername).click();
		await pageHomeChannel.content.btnFullProfile.click();

		await expect(pageHomeChannel.tabs.userInfoUsername).toHaveText(newUsername);
	});
});
