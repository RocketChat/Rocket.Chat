import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { deleteChannel, createTargetChannel } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('Sidebar', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;

	test.beforeAll(async ({ api }) => {
		targetChannel = await createTargetChannel(api, { members: ['user1'] });
	});

	test.afterAll(async ({ api }) => {
		await deleteChannel(api, targetChannel);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
		await page.waitForSelector('main');
	});

	test.describe('global header', async () => {
		test('should display recent chats when navbar search is clicked', async () => {
			await poHomeChannel.navbar.searchInput.click();
			await expect(poHomeChannel.navbar.searchList).toBeVisible();
			await poHomeChannel.navbar.searchInput.blur();
		});

		test('should display home and directory button', async () => {
			await expect(poHomeChannel.navbar.btnHome).toBeVisible();
			await expect(poHomeChannel.navbar.btnDirectory).toBeVisible();
		});

		test('should display home and directory inside a menu in smaller views', async ({ page }) => {
			await page.setViewportSize({ width: 1023, height: 767 });
			await expect(poHomeChannel.navbar.btnMenuPages).toBeVisible();
		});

		test('should display voice and omnichannel items inside a menu and sidebar toggler in mobile view', async ({ page }) => {
			await page.setViewportSize({ width: 767, height: 510 });
			await expect(poHomeChannel.navbar.btnVoiceAndOmnichannel).toBeVisible();
			await expect(poHomeChannel.navbar.btnSidebarToggler()).toBeVisible();
		});

		test('should hide everything else when navbar search is focused in mobile view', async ({ page }) => {
			await page.setViewportSize({ width: 767, height: 510 });
			await poHomeChannel.navbar.searchInput.click();

			await expect(poHomeChannel.navbar.btnMenuPages).not.toBeVisible();
			await expect(poHomeChannel.navbar.btnSidebarToggler()).not.toBeVisible();
			await expect(poHomeChannel.navbar.btnVoiceAndOmnichannel).not.toBeVisible();
			await expect(poHomeChannel.navbar.groupHistoryNavigation).not.toBeVisible();
		});
		test('expect navbar toolbar buttons to be enabled in tablet view', async ({ page }) => {
			await page.setViewportSize({ width: 1023, height: 767 });

			await expect(poHomeChannel.navbar.btnDisplay).toBeEnabled();
			await expect(poHomeChannel.navbar.btnCreateNew).toBeEnabled();
		});
		test('should navigate on navbar toolbar pressing tab', async ({ page }) => {
			await poHomeChannel.navbar.btnHome.focus();
			await page.keyboard.press('Tab');
			await page.keyboard.press('Tab');
			await page.keyboard.press('Tab');
			await page.keyboard.press('Tab');
			await page.keyboard.press('Tab');

			await expect(poHomeChannel.navbar.searchInput).toBeFocused();
		});
	});

	test.describe('Display menu keyboard accessibility', () => {
		test.afterEach(async ({ api }) => {
			await api.post('/users.setPreferences', {
				data: {
					sidebarViewMode: 'extended',
					sidebarDisplayAvatar: true,
					sidebarSortby: 'activity',
					sidebarShowUnread: false,
				},
			});
		});

		test('should change view mode using keyboard', async ({ page }) => {
			await poHomeChannel.navbar.btnDisplay.focus();
			await page.keyboard.press('Enter');
			await expect(poHomeChannel.navbar.menuDisplay).toBeVisible();

			await poHomeChannel.navbar.getDisplayMenuItem('Medium').focus();

			await page.keyboard.press('Space');

			await expect(poHomeChannel.navbar.getDisplayMenuItem('Medium').getByRole('radio')).toBeChecked();
			await page.keyboard.press('Escape');
		});

		test('should toggle Avatars using keyboard', async ({ page }) => {
			await poHomeChannel.navbar.btnDisplay.click();
			const avatarsItem = poHomeChannel.navbar.getDisplayMenuItem('Avatars');

			await avatarsItem.focus();
			await page.keyboard.press('Space');

			const newAvatarsItem = poHomeChannel.navbar.getDisplayMenuItem('Avatars');
			await expect(newAvatarsItem.getByRole('checkbox')).not.toBeChecked();
			await page.keyboard.press('Escape');
		});

		test('should change sort mode using keyboard', async ({ page }) => {
			await poHomeChannel.navbar.btnDisplay.focus();
			await page.keyboard.press('Enter');
			await expect(poHomeChannel.navbar.menuDisplay).toBeVisible();
			await poHomeChannel.navbar.getSortMenuItem('Activity').focus();
			await page.keyboard.press('ArrowDown');
			await expect(poHomeChannel.navbar.getSortMenuItem('Name')).toBeFocused();
			await page.keyboard.press('Space');

			await expect(poHomeChannel.navbar.getSortMenuItem('Name').getByRole('radio')).toBeChecked();
			await page.keyboard.press('Escape');
		});

		test('should toggle grouping using keyboard', async ({ page }) => {
			await poHomeChannel.navbar.btnDisplay.focus();
			await page.keyboard.press('Enter');

			const unreadItem = poHomeChannel.navbar.getGroupByMenuItem('Unread');
			await expect(unreadItem.getByRole('checkbox')).not.toBeChecked();

			await unreadItem.focus();
			await page.keyboard.press('Space');

			await expect(poHomeChannel.navbar.getGroupByMenuItem('Unread').getByRole('checkbox')).toBeChecked();
			await page.keyboard.press('Escape');
		});
	});

	test.describe('sidebar', async () => {
		test('should navigate on sidebar items using arrow keys and restore focus', async ({ page }) => {
			// focus should be on the next item
			await poHomeChannel.sidebar.channelsList.getByRole('link').first().focus();
			await page.keyboard.press('ArrowDown');
			await expect(poHomeChannel.sidebar.channelsList.getByRole('link').first()).not.toBeFocused();

			// shouldn't focus the first item
			await page.keyboard.press('Shift+Tab');
			await page.keyboard.press('Tab');
			await expect(poHomeChannel.sidebar.channelsList.getByRole('link').first()).not.toBeFocused();
		});

		test('should expand/collapse sidebar groups', async ({ page }) => {
			await page.goto('/home');

			const collapser = poHomeChannel.sidebar.firstCollapser.getByRole('button');
			let isExpanded: boolean;

			await collapser.click();
			isExpanded = (await collapser.getAttribute('aria-expanded')) === 'true';
			expect(isExpanded).toBeFalsy();

			await collapser.click();
			isExpanded = (await collapser.getAttribute('aria-expanded')) === 'true';
			expect(isExpanded).toBeTruthy();
		});

		test('should expand/collapse sidebar groups with keyboard', async ({ page }) => {
			await page.goto('/home');

			const collapser = poHomeChannel.sidebar.firstCollapser.getByRole('button');

			await expect(async () => {
				await collapser.focus();
				await expect(collapser).toBeFocused();
				await page.keyboard.press('Enter');
				const isExpanded = (await collapser.getAttribute('aria-expanded')) === 'true';
				expect(isExpanded).toBeFalsy();
			}).toPass();

			await expect(async () => {
				await collapser.focus();
				await page.keyboard.press('Space');
				const isExpanded = (await collapser.getAttribute('aria-expanded')) === 'true';
				expect(isExpanded).toBeTruthy();
			}).toPass();
		});

		test('should persist collapsed/expanded groups after page reload', async ({ page }) => {
			await page.goto('/home');

			const collapser = poHomeChannel.sidebar.firstCollapser;
			await collapser.click();
			const isExpanded = await collapser.getAttribute('aria-expanded');

			await page.reload();

			const isExpandedAfterReload = await collapser.getAttribute('aria-expanded');
			expect(isExpanded).toEqual(isExpandedAfterReload);
		});

		test('should show unread badge on collapser when group is collapsed and has unread items', async () => {
			await poHomeChannel.navbar.openChat(targetChannel);
			await poHomeChannel.content.sendMessage('hello world');

			const item = poHomeChannel.sidebar.getSidebarItemByName(targetChannel);
			await poHomeChannel.sidebar.markItemAsUnread(item);

			const collapser = poHomeChannel.sidebar.getCollapseGroupByName('Channels');
			await collapser.click();
			await expect(poHomeChannel.sidebar.getItemUnreadBadge(collapser)).toBeVisible();
		});
	});

	test.describe('embedded layout', async () => {
		test.beforeEach(async ({ page }) => {
			await page.goto('/home');
			await page.waitForSelector('main');
		});

		test('should not show Navbar', async ({ page }) => {
			await poHomeChannel.navbar.openChat(targetChannel);
			await expect(page.locator('role=navigation[name="header"]')).toBeVisible();
			const embeddedLayoutURL = `${page.url()}?layout=embedded`;
			await page.goto(embeddedLayoutURL);
			await expect(page.locator('role=navigation[name="header"]')).not.toBeVisible();
		});

		test('should show burger menu', async ({ page }) => {
			await page.goto('admin/info?layout=embedded');
			await page.setViewportSize({ width: 767, height: 510 });

			await expect(poHomeChannel.content.burgerButton).toBeVisible();
		});
	});
});
