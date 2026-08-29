import { faker } from '@faker-js/faker';

import { IS_EE } from './config/constants';
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { deleteChannel, setUserPreferences } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('sidebar custom categories', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;
	let targetChannelId: string;

	test.skip(!IS_EE, 'Enterprise Only');

	const uniqueName = (prefix: string) => `${prefix}-${faker.string.uuid().slice(0, 8)}`;

	const createCategory = async (api: Parameters<typeof setUserPreferences>[0], name: string): Promise<void> => {
		await setUserPreferences(api, { sidebarCategories: [{ _id: faker.string.uuid(), name }] });
		await expect(poHomeChannel.sidebar.getCategoryCollapser(name)).toBeVisible();
	};

	const roomBelongsToGroup = async (groupName: string) => {
		const present = await poHomeChannel.content.header.checkRoomBelongsToGroup(`Remove from ${groupName}`);
		return present;
	};

	test.beforeAll(async ({ api }) => {
		const name = faker.string.uuid();
		const created = await (await api.post('/channels.create', { name })).json();
		targetChannel = name;
		targetChannelId = created.channel._id;

		await setUserPreferences(api, { sidebarCategories: [] });
	});

	test.afterAll(async ({ api }) => {
		await setUserPreferences(api, { sidebarCategories: [] });
		await api.post('/rooms.favorite', { roomId: targetChannelId, favorite: false });
		await deleteChannel(api, targetChannel);
	});

	test.beforeEach(async ({ api, page }) => {
		await setUserPreferences(api, { sidebarCategories: [] });
		await api.post('/rooms.favorite', { roomId: targetChannelId, favorite: false });
		poHomeChannel = new HomeChannel(page);
		await page.goto('/home');
		await poHomeChannel.waitForHome();
	});

	test.describe('create (+) menu', () => {
		test('should expose a "Category" entry', async () => {
			await poHomeChannel.navbar.btnCreateNew.click();
			await expect(poHomeChannel.navbar.createNewMenuItem('Category')).toBeVisible();
		});

		test('should create an empty category (rendered as a header with no rooms)', async () => {
			const name = uniqueName('cat');
			await poHomeChannel.navbar.createNewCategory(name);
			await expect(poHomeChannel.sidebar.getCategoryCollapser(name)).toBeVisible();
		});
	});

	test.describe('category actions (custom category)', () => {
		const category = uniqueName('ren');

		test.beforeEach(async ({ api }) => {
			await createCategory(api, category);
		});

		test('should rename a category', async () => {
			const renamed = `${category}-renamed`;

			await poHomeChannel.sidebar.renameCategory(category, renamed);
			await expect(poHomeChannel.sidebar.getCategoryCollapser(renamed)).toBeVisible();
			await expect(poHomeChannel.sidebar.getCategoryCollapser(category)).toHaveCount(0);
		});

		test('should delete a category and return its rooms to the system group', async () => {
			await poHomeChannel.sidebar.moveRoomToCategory(targetChannel, category);
			await poHomeChannel.sidebar.deleteCategory(category);

			await expect(poHomeChannel.sidebar.getCategoryCollapser(category)).toHaveCount(0);
			await expect(poHomeChannel.sidebar.getSidebarItemByName(targetChannel)).toBeVisible();
		});

		test('should toggle "Always display"', async () => {
			await poHomeChannel.sidebar.openCategoryMenu(category);
			const toggle = poHomeChannel.page.getByRole('menuitemcheckbox', { name: 'Always display' });
			await expect(toggle).toBeVisible();
			await expect(toggle.getByRole('checkbox')).toBeChecked({ checked: false });
			await toggle.click();
			await expect(toggle.getByRole('checkbox')).toBeChecked({ checked: true });
			await poHomeChannel.page.keyboard.press('Escape');
		});

		test('should open the Create channel modal via the "Create new" submenu', async () => {
			await poHomeChannel.sidebar.openCategoryMenu(category);
			await poHomeChannel.page.getByRole('menuitem', { name: 'Create new', exact: true }).hover();
			await poHomeChannel.page.getByRole('menuitem', { name: 'Channel', exact: true }).click();

			await poHomeChannel.navbar.modals.Channel.waitForDisplay();
			await poHomeChannel.page.keyboard.press('Escape');
		});
	});

	test.describe('system group actions (reduced menu)', () => {
		test('should show a reduced menu without Rename / Delete / New channel / New category / Create new', async () => {
			await poHomeChannel.sidebar.openCategoryMenu('Channels');

			await expect(poHomeChannel.page.getByRole('menuitemcheckbox', { name: 'Move up', exact: true })).toBeVisible();
			await expect(poHomeChannel.page.getByRole('menuitemcheckbox', { name: 'Move down', exact: true })).toBeVisible();
			await expect(poHomeChannel.page.getByRole('menuitemcheckbox', { name: 'Always display' })).toBeVisible();

			await expect(poHomeChannel.page.getByRole('menuitemcheckbox', { name: 'Manage', exact: true })).toHaveCount(0);
			await expect(poHomeChannel.page.getByRole('menuitemcheckbox', { name: 'Delete', exact: true })).toHaveCount(0);
			await expect(poHomeChannel.page.getByRole('menuitem', { name: 'Create new', exact: true })).toHaveCount(0);
			await poHomeChannel.page.keyboard.press('Escape');
		});
	});

	test.describe('manage category in room actions', () => {
		const category = uniqueName('ren');

		test.beforeEach(async ({ api }) => {
			await createCategory(api, category);
			await poHomeChannel.gotoChannel(targetChannel);
		});

		test('should move a room into a category', async () => {
			await poHomeChannel.sidebar.moveRoomToCategory(targetChannel, category);
			expect(await roomBelongsToGroup(category)).toBe(true);
		});

		test('should move a room to Favorites and back', async () => {
			await poHomeChannel.sidebar.moveRoomToFavorites(targetChannel);
			expect(await roomBelongsToGroup('Favorites')).toBe(true);

			await poHomeChannel.sidebar.removeRoomFromFavorites(targetChannel);
			expect(await roomBelongsToGroup('Favorites')).toBe(false);
		});

		test('should remove a room from a category', async () => {
			await poHomeChannel.sidebar.moveRoomToCategory(targetChannel, category);
			expect(await roomBelongsToGroup(category)).toBe(true);

			await poHomeChannel.sidebar.removeRoomFromCategory(targetChannel, category);
			expect(await roomBelongsToGroup(category)).toBe(false);
		});

		test('should create a category and move the room into it in one step', async () => {
			const newCat = uniqueName('cat');
			await poHomeChannel.sidebar.createCategoryFromRoom(targetChannel, newCat);

			await expect(poHomeChannel.sidebar.getCategoryCollapser(newCat)).toBeVisible();
			expect(await roomBelongsToGroup(newCat)).toBe(true);
		});

		test('should move the room into a category from the header', async () => {
			const newCat = uniqueName('cat');
			await poHomeChannel.content.header.createCategory(newCat);

			expect(await roomBelongsToGroup(newCat)).toBe(true);
		});

		test('should favorite the room from the header and remove it', async () => {
			await poHomeChannel.content.header.pickCategoryMenuItem('Favorites');
			expect(await roomBelongsToGroup('Favorites')).toBe(true);

			await poHomeChannel.content.header.pickCategoryMenuItem('Remove from Favorites');
			expect(await roomBelongsToGroup('Favorites')).toBe(false);
		});

		test('should move the room into an existing category from the header', async () => {
			await poHomeChannel.content.header.pickCategoryMenuItem(category);

			expect(await roomBelongsToGroup(category)).toBe(true);
		});
	});
});
