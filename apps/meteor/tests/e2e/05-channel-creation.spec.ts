import { test } from '@playwright/test';
import { faker } from '@faker-js/faker';

import { validUserInserted, ROCKET_CAT } from './utils/mocks/userAndPasswordMock';
import { Login, ChannelCreation } from './page-objects';

test.describe('[Channel]', async () => {
	let channelCreation: ChannelCreation;
	let login: Login;

	const HELLO = 'Hello';

	test.beforeEach(async ({ page, baseURL }) => {
		const baseUrl = baseURL as string;
		login = new Login(page);
		channelCreation = new ChannelCreation(page);

		await page.goto(baseUrl);
		await login.doLogin(validUserInserted);
	});

	test.describe('[Public and private channel creation]', () => {
		let channelName: string;
		test.beforeEach(async () => {
			channelName = faker.animal.type();
		});

		test('expect create privateChannel channel', async () => {
			await channelCreation.doCreateChannel(channelName, true);
		});

		test('expect create public channel', async () => {
			await channelCreation.doCreateChannel(channelName, false);
		});
	});
	test('expect send message to channel created', async () => {
		await channelCreation.doSendMessage(ROCKET_CAT, HELLO);
	});
});
