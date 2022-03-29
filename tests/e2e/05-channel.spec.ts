import { test } from '@playwright/test';
import { v4 } from 'uuid';

import ChannelCreation from './utils/pageobjects/ChannelCreation';
import LoginPage from './utils/pageobjects/login.page';

test.describe.parallel('[Channel]', async () => {
	let channelCreation: ChannelCreation;
	let loginPage: LoginPage;
	let channelName: string;
	test.beforeAll(async ({ browser, baseURL }) => {
		loginPage = new LoginPage(browser, baseURL as string);
		await loginPage.open();
		await loginPage.login({ email: 'weslleydrum@hotmail.com', password: 'Weslley901@@' });

		channelCreation = new ChannelCreation(loginPage.getPage());
	});

	test.beforeEach(async () => {
		channelName = v4();
	});
	// Cenário negativo
	// Cenário positivo

	test('expect create privateChannel channel', async () => {
		await channelCreation.createPrivateChannel(channelName, true);
	});

	test('expect create public channel', async () => {
		await channelCreation.createPrivateChannel(channelName, false);
	});
});
