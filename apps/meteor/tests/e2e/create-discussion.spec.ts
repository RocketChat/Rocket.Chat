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

		await poHomeDiscussion.navbar.createNewDiscussion('general', discussionName, discussionMessage);

		await expect(page).toHaveURL(/\/channel\/[a-z0-9]{0,17}$/i);
	});
});
