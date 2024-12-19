import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel, deleteChannel } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('sidebar', () => {
	let poHomeDiscussion: HomeChannel;
	let targetChannel: string;

	test.beforeEach(async ({ api, page }) => {
		poHomeDiscussion = new HomeChannel(page);
		targetChannel = await createTargetChannel(api, { members: ['user1'] });

		await page.goto('/home');
	});

	test.afterEach(async ({ api }) => {
		await deleteChannel(api, targetChannel);
	});

	test('should navigate on sidebar toolbar using arrow keys', async ({ page }) => {
		await poHomeDiscussion.content.waitForPageLoad();
		await poHomeDiscussion.navbar.homeButton.focus();
		await page.keyboard.press('ArrowRight');
		await expect(poHomeDiscussion.navbar.directoryButton).toBeFocused();
	});

	test('should navigate on sidebar items using arrow keys and restore focus', async ({ page }) => {
		// focus should be on the next item
		await poHomeDiscussion.sidebar.channelsList.getByRole('link').first().focus();
		await page.keyboard.press('ArrowDown');
		await expect(poHomeDiscussion.sidebar.channelsList.getByRole('link').first()).not.toBeFocused();

		// shouldn't focus the first item
		await page.keyboard.press('Shift+Tab');
		await page.keyboard.press('Tab');
		await expect(poHomeDiscussion.sidebar.channelsList.getByRole('link').first()).not.toBeFocused();
	});

	test('should display "Recent" button on sidebar search section, and display recent chats when clicked', async ({ page }) => {
		await page.goto('/home');

		await poHomeDiscussion.sidebar.btnRecent.click();
		await expect(poHomeDiscussion.sidebar.sidebar.getByRole('heading', { name: 'Recent' })).toBeVisible();
	});

	test('should expand/collapse sidebar groups', async ({ page }) => {
		await page.goto('/home');
		const collapser = poHomeDiscussion.sidebar.firstCollapser;
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

		const collapser = poHomeDiscussion.sidebar.firstCollapser;

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

	test('should be able to use keyboard to navigate through sidebar items', async ({ page }) => {
		await page.goto('/home');

		const collapser = poHomeDiscussion.sidebar.firstCollapser;
		const dataIndex = await collapser.locator('../..').getAttribute('data-index');
		const nextItem = page.locator(`[data-index="${Number(dataIndex) + 1}"]`).getByRole('link');

		await expect(async () => {
			await collapser.focus();
			await page.keyboard.press('ArrowDown');
			await expect(nextItem).toBeFocused();
		}).toPass();
	});

	test('should persist collapsed/expanded groups after page reload', async ({ page }) => {
		await page.goto('/home');

		const collapser = poHomeDiscussion.sidebar.firstCollapser;
		await collapser.click();
		const isExpanded = await collapser.getAttribute('aria-expanded');

		await page.reload();

		const isExpandedAfterReload = await collapser.getAttribute('aria-expanded');
		expect(isExpanded).toEqual(isExpandedAfterReload);
	});

	test('should show unread badge on collapser when group is collapsed and has unread items', async ({ page }) => {
		await page.goto('/home');

		await poHomeDiscussion.sidebar.openChat(targetChannel);
		await poHomeDiscussion.content.sendMessage('hello world');

		await poHomeDiscussion.sidebar.typeSearch(targetChannel);
		const item = poHomeDiscussion.sidebar.getSearchRoomByName(targetChannel);
		await poHomeDiscussion.sidebar.markItemAsUnread(item);
		await poHomeDiscussion.sidebar.escSearch();

		const collapser = poHomeDiscussion.sidebar.getCollapseGroupByName('Channels');
		await collapser.click();
		await expect(poHomeDiscussion.sidebar.getItemUnreadBadge(collapser)).toBeVisible();
	});
});
