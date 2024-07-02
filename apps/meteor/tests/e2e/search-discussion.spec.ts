import type { Page } from '@playwright/test';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetDiscussion } from './utils';
import { getSettingValueById } from './utils/getSettingValueById';
import { setSettingValueById } from './utils/setSettingValueById';
import { test, expect } from './utils/test';

test.use({ storageState: Users.user1.state });

test.describe.serial('search-discussion', () => {
	let settingDefaultValue: unknown;
	let poHomeChannel: HomeChannel;
	let discussionName: string;

	test.beforeAll(async ({ api }) => {
		settingDefaultValue = await getSettingValueById(api, 'UI_Allow_room_names_with_special_chars');
	});

	test.beforeEach(async ({ page, api }) => {
		discussionName = await createTargetDiscussion(api);
		poHomeChannel = new HomeChannel(page);
		await page.goto('/home');
	});

	test.afterAll(async ({ api }) => {
		await setSettingValueById(api, 'UI_Allow_room_names_with_special_chars', settingDefaultValue);
	});

	const testDiscussionSearch = async (page: Page) => {
		await poHomeChannel.sidenav.openSearch();
		await poHomeChannel.sidenav.inputSearch.type(discussionName);
		const targetSearchItem = page.locator('role=listbox').getByText(discussionName).first();
		await expect(targetSearchItem).toBeVisible();
	};

	test('expect search discussion to show fname when UI_Allow_room_names_with_special_chars=true', async ({ page, api }) => {
		await setSettingValueById(api, 'UI_Allow_room_names_with_special_chars', true);
		await testDiscussionSearch(page);
	});

	test('expect search discussion to show fname when UI_Allow_room_names_with_special_chars=false', async ({ page, api }) => {
		await setSettingValueById(api, 'UI_Allow_room_names_with_special_chars', false);
		await testDiscussionSearch(page);
	});
});
