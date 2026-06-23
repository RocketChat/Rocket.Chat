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

	test.describe('Mobile Viewport', () => {
		test.use({ viewport: { width: 640, height: 460 } });

		test('featured action (Threads) remains visible in the header on narrow viewport', async ({ page }) => {
			const po = new HomeChannel(page);
			await po.gotoChannel(targetChannel);

			await expect(po.roomToolbar.btnThreads).toBeVisible();
		});

		test('normal actions (Members, Discussions) collapse into Options dropdown on narrow viewport', async ({ page }) => {
			const po = new HomeChannel(page);
			await po.gotoChannel(targetChannel);

			await expect(po.roomToolbar.btnMembers).not.toBeVisible();
			await expect(po.roomToolbar.btnDiscussion).not.toBeVisible();

			await po.roomToolbar.openMoreOptions();
			await expect(po.roomToolbar.menu.getMenuItem('Members')).toBeVisible();
			await expect(po.roomToolbar.menu.getMenuItem('Discussions')).toBeVisible();
		});
	});

	test.describe('Soft Fallbacks', () => {
		test('feature disabled: toolbar uses legacy behavior without crashing', async ({ api, page }) => {
			await setUserPreferences(api, {
				featuresPreview: [{ name: 'roomToolboxLayout', value: false }],
			});

			const po = new HomeChannel(page);
			await po.gotoChannel(targetChannel);

			await expect(po.roomToolbar.btnMoreOptions).toBeVisible();
			await expect(page.getByRole('toolbar', { name: 'Primary Room actions' })).toBeVisible();

			await setUserPreferences(api, {
				featuresPreview: [{ name: 'roomToolboxLayout', value: true }],
			});
		});

		test('malformed JSON config: toolbar falls back gracefully without crashing', async ({ api, page }) => {
			await setSettingValueById(api, 'Room_Toolbox_Layout', '{ invalid json }');

			const po = new HomeChannel(page);
			await po.gotoChannel(targetChannel);

			await expect(po.roomToolbar.btnMoreOptions).toBeVisible();
			await expect(page.getByRole('toolbar', { name: 'Primary Room actions' })).toBeVisible();

			await setSettingValueById(api, 'Room_Toolbox_Layout', LAYOUT_CONFIG);
		});
	});
});
