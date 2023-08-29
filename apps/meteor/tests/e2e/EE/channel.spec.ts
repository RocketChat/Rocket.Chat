import { expect } from '@playwright/test';

import { Users } from '../fixtures/userStates';
import createChannel from '../locators/createChannel.json';
import home from '../locators/home.json';
import { test } from '../utils/test';

test.use({ storageState: Users.admin.state });

test.beforeEach(async ({ page }) => {
	await page.goto(`/home`);
});

test('Create a Private Channel', async ({ page }) => {
	await page.locator(home.button.createNew).click();
	await page.getByTestId(home.dropdown.createNew).getByText(home.text.channel).click();
	await page.getByPlaceholder(createChannel.placeholder.channelName).fill(createChannel.names.channel);
	await page.getByRole('button', { name: createChannel.button.create }).click();

	expect(await page.getByRole('link', { name: createChannel.names.channel }).isVisible());
});

test('Create a Public Channel', async ({ page }) => {
	await page.locator(home.button.createNew).click();
	await page.getByTestId(home.dropdown.createNew).getByText(home.text.channel).click();
	await page.getByPlaceholder(createChannel.placeholder.channelName).fill(createChannel.names.channel);
	await page.locator(createChannel.toggle.private).first().click();
	await page.getByRole('button', { name: createChannel.button.create }).click();

	expect(await page.getByRole('link', { name: createChannel.names.channel }).isVisible());
});

test.afterEach(async ({ api }) => {
	await api.post(`/api/v1/channels.delete`, {
		roomName: `${createChannel.names.channel}`,
	});
});
