import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

import { HomeChannel } from './page-objects';

test.use({ storageState: 'session-admin.json' });

test.describe.parallel('create-channel', () => {
	let poHomeChannel: HomeChannel;

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

        await page.goto('/')
	});

	test('expect create public channel', async ({ page }) => {
		const name = faker.animal.type() + Date.now();

		await poHomeChannel.sidenav.openNewByText('Channel');
		await poHomeChannel.sidenav.checkboxPrivateChannel.click();
		await poHomeChannel.sidenav.inputChannelName.type(name);
		await poHomeChannel.sidenav.btnCreateChannel.click();

		await expect(page).toHaveURL(`/channel/${name}`);
	});

	test('expect create private channel', async ({ page }) => {
		const name = faker.animal.type() + Date.now();
        
		await poHomeChannel.sidenav.openNewByText('Channel');
		await poHomeChannel.sidenav.inputChannelName.type(name);
		await poHomeChannel.sidenav.btnCreateChannel.click();

		await expect(page).toHaveURL(`/group/${name}`);
	});
});
