import { test } from '@playwright/test';
import { v4 } from 'uuid';

import ChannelCreation from './utils/pageobjects/ChannelCreation';
import LoginPage from './utils/pageobjects/login.page';
import { validUser } from './utils/mocks/userAndPasswordMock';

const targetUser = 'rocket.cat';
test.describe.parallel('[Channel]', async () => {
	let channelCreation: ChannelCreation;
	let loginPage: LoginPage;
	let channelName: string;
	test.beforeAll(async ({ browser, baseURL }) => {
		loginPage = new LoginPage(browser, baseURL as string);
		await loginPage.open();
		await loginPage.login(validUser);

		channelCreation = new ChannelCreation(loginPage.getPage());
	});

	test.beforeEach(async () => {
		channelName = v4();
	});

	test('expect create privateChannel channel', async () => {
		await channelCreation.createChannel(channelName, true);
	});

	test('expect create public channel', async () => {
		await channelCreation.createChannel(channelName, false);
	});

	test.only('expect send to channel created', async () => {
		await channelCreation.sendMessage(targetUser);
	});
});
