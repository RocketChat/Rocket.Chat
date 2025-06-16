import type { Page } from '@playwright/test';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetDiscussion, deleteRoom } from './utils';
import { getSettingValueById } from './utils/getSettingValueById';
import { setSettingValueById } from './utils/setSettingValueById';
import { test, expect } from './utils/test';

test.use({ storageState: Users.user1.state });

test.describe.serial('search-discussion', () => {
	let settingDefaultValue: unknown;
	let poHomeChannel: HomeChannel;
	let discussion: Record<string, string>;

	test.beforeAll(async ({ api }) => {
		settingDefaultValue = await getSettingValueById(api, 'UI_Allow_room_names_with_special_chars');
	});

	test.beforeEach(async ({ page, api }) => {
		discussion = await createTargetDiscussion(api);
		poHomeChannel = new HomeChannel(page);
		await page.goto('/home');
	});

	test.afterAll(async ({ api }) => {
		await setSettingValueById(api, 'UI_Allow_room_names_with_special_chars', settingDefaultValue);
		await deleteRoom(api, discussion._id);
	});

	const testDiscussionSearch = async (page: Page) => {
		await poHomeChannel.sidenav.openSearch();
		await poHomeChannel.sidenav.inputSearch.fill(discussion.fname);
		const targetSearchItem = page.locator('role=listbox').getByText(discussion.fname).first();
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
