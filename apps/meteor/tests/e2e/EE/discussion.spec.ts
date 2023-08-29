import { expect } from '@playwright/test';

import { Users } from '../fixtures/userStates';
import createDiscussion from '../locators/createDiscussion.json';
import home from '../locators/home.json';
import { test } from '../utils/test';

test.use({ storageState: Users.admin.state });

test.beforeEach(async ({ page, api }) => {
	await api.post(`/api/v1/channels.create`, {
		name: createDiscussion.names.channel,
	});
	await page.goto(`/home`);
});

test('Create a discussion', async ({ page }) => {
	await page.locator(home.button.createNew).click();
	await page.getByTestId(home.dropdown.createNew).getByText(home.text.discussion).click();
	await page.getByPlaceholder(createDiscussion.placeholder.selectChannel).fill(createDiscussion.names.channel);
	await page.getByRole('option', { name: createDiscussion.names.channel, exact: true }).locator('div').first().click();
	await page.getByPlaceholder(createDiscussion.placeholder.nameDiscussion).fill(createDiscussion.names.discussion);
	await page.getByRole('button', { name: createDiscussion.button.create }).click();

	expect(await page.getByRole('link', { name: createDiscussion.names.discussion }).isVisible());
});

test.afterEach(async ({ api }) => {
	await api.post(`/api/v1/channels.delete`, {
		roomName: `${createDiscussion.names.channel}`,
	});

	await api.post(`/api/v1/groups.delete`, {
		roomName: `${createDiscussion.names.discussion}`,
	});
});
