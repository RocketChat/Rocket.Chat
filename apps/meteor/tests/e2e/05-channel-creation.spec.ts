import { test } from '@playwright/test';
import { faker } from '@faker-js/faker';

import { LoginPage, ChannelCreation } from './pageobjects';
import { adminLogin } from './utils/mocks/userAndPasswordMock';

test.describe('[Channel]', async () => {
	let channelCreation: ChannelCreation;
	let loginPage: LoginPage;

	test.beforeAll(async ({ browser }) => {
		const page = await browser.newPage();
		loginPage = new LoginPage(page);
		channelCreation = new ChannelCreation(page);

		await loginPage.goto('/');
		await loginPage.doLogin(adminLogin);
	});

	test('expect create private channel', async () => {
		await channelCreation.doCreateChannel(faker.animal.type() + Date.now(), true);
	});

	test('expect create public channel', async () => {
		await channelCreation.doCreateChannel(faker.animal.type() + Date.now());
	});
});
