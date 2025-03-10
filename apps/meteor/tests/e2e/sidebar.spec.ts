import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { setSettingValueById } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('sidebar', () => {
	let poHomeDiscussion: HomeChannel;

	test.beforeEach(async ({ page }) => {
		poHomeDiscussion = new HomeChannel(page);

		await page.goto('/home');
	});

	test('should navigate on sidebar toolbar using arrow keys', async ({ page }) => {
		await poHomeDiscussion.sidenav.userProfileMenu.focus();
		await page.keyboard.press('Tab');
		await page.keyboard.press('ArrowRight');

		await expect(poHomeDiscussion.sidenav.sidebarToolbar.getByRole('button', { name: 'Search' })).toBeFocused();
	});

	test('should navigate on sidebar items using arrow keys and restore focus', async ({ page }) => {
		// focus should be on the next item
		await poHomeDiscussion.sidenav.sidebarChannelsList.getByRole('link').first().focus();
		await page.keyboard.press('ArrowDown');
		await expect(poHomeDiscussion.sidenav.sidebarChannelsList.getByRole('link').first()).not.toBeFocused();

		// shouldn't focus the first item
		await page.keyboard.press('Shift+Tab');
		await page.keyboard.press('Tab');
		await expect(poHomeDiscussion.sidenav.sidebarChannelsList.getByRole('link').first()).not.toBeFocused();
	});

	test.describe('SidebarV2', () => {
		test.beforeAll(({ api }) =>
			Promise.all([setSettingValueById(api, 'Accounts_AllowFeaturePreview', true), setSettingValueById(api, 'newNavigation', true)]),
		);

		test.afterAll(({ api }) =>
			Promise.all([setSettingValueById(api, 'Accounts_AllowFeaturePreview', false), setSettingValueById(api, 'newNavigation', false)]),
		);

		test('should ensure the room list spans the full width of the sidebar', async ({ page }) => {
			const sidebarV2 = page.getByLabel('sidebar');
			const sidebarWidth = await sidebarV2.boundingBox();
			const roomListWidth = await sidebarV2.getByTestId('virtuoso-item-list').boundingBox();
			expect(roomListWidth?.width).toBeCloseTo(sidebarWidth?.width || -10, 1);
		});
	});
});
