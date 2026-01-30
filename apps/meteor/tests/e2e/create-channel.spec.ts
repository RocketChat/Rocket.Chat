import { faker } from '@faker-js/faker';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('create-channel', () => {
	let poHomeChannel: HomeChannel;

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test('expect create a public channel', async ({ page }) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.navbar.createNew('Channel', channelName, { private: false });

		await expect(page).toHaveURL(`/channel/${channelName}`);
	});

	test('expect create a private channel', async ({ page }) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.navbar.createNew('Channel', channelName, { private: true });

		await expect(page).toHaveURL(`/group/${channelName}`);
	});
});
