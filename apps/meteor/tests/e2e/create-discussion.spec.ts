import { faker } from '@faker-js/faker';

import { Users } from './fixtures/userStates';
import { HomeDiscussion } from './page-objects';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('create-discussion', () => {
	let poHomeDiscussion: HomeDiscussion;

	test.beforeEach(async ({ page }) => {
		poHomeDiscussion = new HomeDiscussion(page);

		await page.goto('/home');
	});

	test('expect create discussion', async ({ page }) => {
		const discussionName = faker.string.uuid();
		const discussionMessage = faker.animal.type();

		await poHomeDiscussion.sidenav.openNewByLabel('Discussion');
		await poHomeDiscussion.inputChannelName.type('general');
		await page.locator('role=listbox >> role=option[name=general]').click();
		await poHomeDiscussion.inputName.type(discussionName);
		await poHomeDiscussion.inputMessage.type(discussionMessage);
		await poHomeDiscussion.btnCreate.click();

		await expect(page).toHaveURL(/\/channel\/[a-z0-9]{0,17}$/i);
	});
});
