import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

import { HomeChannel } from './page-objects';

test.use({ storageState: 'session-admin.json' });

test.describe.parallel('create-channel', () => {
	let poHomeChannel: HomeChannel;

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

        await page.goto('/home')
	});

	test('expect create public channel', async ({ page }) => {
		const channelName = faker.datatype.uuid();

		await poHomeChannel.sidenav.openNewByLabel('Channel');
		await poHomeChannel.sidenav.checkboxPrivateChannel.click();
		await poHomeChannel.sidenav.inputChannelName.type(channelName);
		await poHomeChannel.sidenav.btnCreateChannel.click();
		
		await expect(page).toHaveURL(`/channel/${channelName}`);
	});

	test('expect create private channel', async ({ page }) => {
		const channelName = faker.datatype.uuid();
        
		await poHomeChannel.sidenav.openNewByLabel('Channel');
		await poHomeChannel.sidenav.inputChannelName.type(channelName);
		await poHomeChannel.sidenav.btnCreateChannel.click();

		await expect(page).toHaveURL(`/group/${channelName}`);
	});
});
