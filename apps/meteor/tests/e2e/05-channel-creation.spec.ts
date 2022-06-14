import { test } from '@playwright/test';
import { faker } from '@faker-js/faker';

import ChannelCreation from './utils/pageobjects/ChannelCreation';
import LoginPage from './utils/pageobjects/LoginPage';
import { validUserInserted, ROCKET_CAT } from './utils/mocks/userAndPasswordMock';

test.describe('[Channel]', async () => {
	let channelCreation: ChannelCreation;
	let loginPage: LoginPage;

	const HELLO = 'Hello';

	test.beforeEach(async ({ page, baseURL }) => {
		const baseUrl = baseURL as string;
		loginPage = new LoginPage(page);
		await loginPage.goto(baseUrl);
		await loginPage.login(validUserInserted);

		channelCreation = new ChannelCreation(page);
	});

	test.describe('[Public and private channel creation]', () => {
		let channelName: string;
		test.beforeEach(async () => {
			channelName = faker.animal.type();
		});

		test('expect create privateChannel channel', async () => {
			await channelCreation.createChannel(channelName, true);
		});

		test('expect create public channel', async () => {
			await channelCreation.createChannel(channelName, false);
		});
	});
	test('expect send message to channel created', async () => {
		await channelCreation.sendMessage(ROCKET_CAT, HELLO);
	});
});
