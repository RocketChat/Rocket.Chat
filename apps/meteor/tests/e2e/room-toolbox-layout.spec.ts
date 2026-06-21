import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel, deleteChannel, setSettingValueById } from './utils';
import { setUserPreferences } from './utils/setUserPreferences';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

const LAYOUT_CONFIG = JSON.stringify({
	maxVisibleNormal: 2,
	items: [
		{ id: 'thread', featured: true, order: 1 },
		{ id: 'members-list', featured: false, order: 2 },
		{ id: 'discussions', featured: false, order: 3 },
	],
});

test.describe.serial('room toolbox layout', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;

	test.beforeAll(async ({ api }) => {
		await setSettingValueById(api, 'Accounts_AllowFeaturePreview', true);
		await setSettingValueById(api, 'Room_Toolbox_Layout', LAYOUT_CONFIG);
		await setUserPreferences(api, {
			featuresPreview: [{ name: 'roomToolboxLayout', value: true }],
		});
		targetChannel = await createTargetChannel(api);
	});

	test.afterAll(async ({ api }) => {
		await setSettingValueById(api, 'Room_Toolbox_Layout', '');
		await setUserPreferences(api, {
			featuresPreview: [{ name: 'roomToolboxLayout', value: false }],
		});
		await deleteChannel(api, targetChannel);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		await poHomeChannel.gotoChannel(targetChannel);
	});

	test.describe('Custom Layout Ordering and Pinning', () => {
		test('featured action (Threads) is visible in the header', async () => {
			await expect(poHomeChannel.roomToolbar.btnThreads).toBeVisible();
		});

		test('visible normal actions (Members, Discussions) are shown in the header', async () => {
			await expect(poHomeChannel.roomToolbar.btnMembers).toBeVisible();
			await expect(poHomeChannel.roomToolbar.btnDiscussion).toBeVisible();
		});

		test('actions beyond maxVisibleNormal (Files) are in the kebab menu', async () => {
			await expect(poHomeChannel.roomToolbar.btnFiles).not.toBeVisible();

			await poHomeChannel.roomToolbar.openMoreOptions();
			await expect(poHomeChannel.roomToolbar.menuItemPinnedMessages).toBeVisible();
		});
	});
});
