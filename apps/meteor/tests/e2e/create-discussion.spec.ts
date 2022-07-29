import { faker } from '@faker-js/faker';

import { test, expect } from './utils/test';
import { HomeDiscussion } from './page-objects';

test.use({ storageState: 'admin-session.json' });

test.describe.serial('create-discussion', () => {
	let poHomeDiscussion: HomeDiscussion;

	test.beforeEach(async ({ page }) => {
		poHomeDiscussion = new HomeDiscussion(page);

		await page.goto('/home');
	});

	test('expect create discussion', async ({ page }) => {
		const discussionName = faker.datatype.uuid();
		const discussionMessage = faker.animal.type();

		await poHomeDiscussion.sidenav.openNewByLabel('Discussion');
		await poHomeDiscussion.inputChannelName.type('general');
		await page.keyboard.press('Enter');
		await poHomeDiscussion.inputName.type(discussionName);
		await poHomeDiscussion.inputMessage.type(discussionMessage);
		await poHomeDiscussion.btnCreate.click();

		await expect(page).toHaveURL(/\/channel\/[a-z0-9]{0,17}$/i);
	});
});
