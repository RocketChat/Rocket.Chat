import { faker } from '@faker-js/faker';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { deleteChannel, setUserPreferences } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

/**
 * Custom sidebar categories — per-user groupings of sidebar rooms, persisted in the
 * `sidebarCustomCategories` user preference. Exercised against the default (classic) sidebar.
 *
 * Covers the create (+) menu entry, category-collapser actions (custom + reduced system-group menu),
 * sidebar room item actions (the "Move to ▸" kebab submenu), and the room-header grouping control.
 *
 * Each test starts from a clean slate (no categories, target room not favorited), reset via the API in
 * `beforeEach`, so the tests are order-independent.
 */
test.describe.serial('sidebar custom categories', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;
	let targetChannelId: string;
	let originalGroupByType: boolean | undefined;

	const uniqueName = (prefix: string) => `${prefix}-${faker.string.uuid().slice(0, 8)}`;

	/** Creates a category through the create (+) menu modal and waits for its collapser to appear. */
	const createCategory = async (name: string) => {
		await poHomeChannel.navbar.openCreateCategory();
		const dialog = poHomeChannel.page.getByRole('dialog', { name: 'Create category' });
		await expect(dialog).toBeVisible();
		await dialog.getByRole('textbox', { name: 'Name' }).fill(name);
		await dialog.getByRole('button', { name: 'Create', exact: true }).click();
		await expect(dialog).not.toBeVisible();
		await expect(poHomeChannel.sidebar.getCategoryCollapser(name)).toBeVisible();
	};

	/** Creates a category with a chosen emoji through the create (+) modal + emoji picker. */
	const createCategoryWithEmoji = async (name: string, emojiName = 'rocket') => {
		await poHomeChannel.navbar.openCreateCategory();
		const dialog = poHomeChannel.page.getByRole('dialog', { name: 'Create category' });
		await dialog.getByRole('button', { name: 'Add emoji' }).click();
		const picker = poHomeChannel.page.getByRole('dialog', { name: 'Emoji picker' });
		await expect(picker).toBeVisible();
		await picker.getByRole('textbox').first().fill(emojiName);
		await poHomeChannel.page.locator(`[data-emoji="${emojiName}"]`).first().click();
		await dialog.getByRole('textbox', { name: 'Name' }).fill(name);
		await dialog.getByRole('button', { name: 'Create', exact: true }).click();
		await expect(dialog).not.toBeVisible();
		await expect(poHomeChannel.sidebar.getCategoryCollapser(name)).toBeVisible();
	};

	/** True when the target room currently belongs to the named grouping (its submenu offers "Remove from …"). */
	const isRoomInGrouping = async (groupingName: string) => {
		await poHomeChannel.sidebar.openRoomMoveToSubmenu(targetChannel);
		const present = (await poHomeChannel.sidebar.roomMenuMoveToItem(`Remove from ${groupingName}`).count()) > 0;
		await poHomeChannel.page.keyboard.press('Escape');
		return present;
	};

	test.beforeAll(async ({ api }) => {
		const name = faker.string.uuid();
		const created = await (await api.post('/channels.create', { name })).json();
		targetChannel = name;
		targetChannelId = created.channel._id;

		const prefs = await (await api.get('/users.getPreferences')).json();
		originalGroupByType = prefs.preferences?.sidebarGroupByType;
		// Group-by-type guarantees a "Channels" system group exists for the reduced-menu tests.
		await setUserPreferences(api, { sidebarGroupByType: true, sidebarCustomCategories: [] });
	});

	test.afterAll(async ({ api }) => {
		await setUserPreferences(api, { sidebarCustomCategories: [], sidebarGroupByType: originalGroupByType ?? false });
		await api.post('/rooms.favorite', { roomId: targetChannelId, favorite: false });
		await deleteChannel(api, targetChannel);
	});

	test.beforeEach(async ({ api, page }) => {
		await setUserPreferences(api, { sidebarCustomCategories: [] });
		await api.post('/rooms.favorite', { roomId: targetChannelId, favorite: false });
		poHomeChannel = new HomeChannel(page);
		await page.goto('/home');
	});

	test.describe('create (+) menu', () => {
		test('should expose a "Category" entry', async () => {
			await poHomeChannel.navbar.btnCreateNew.click();
			await expect(poHomeChannel.navbar.createNewMenu.getByRole('menuitem', { name: 'Category', exact: true })).toBeVisible();
		});

		test('should create a category with an empty "Drag rooms here" placeholder', async () => {
			const name = uniqueName('cat');
			await createCategory(name);
			await expect(poHomeChannel.sidebar.dragRoomsPlaceholder.first()).toBeVisible();
		});

		test('should reject an empty name', async () => {
			await poHomeChannel.navbar.openCreateCategory();
			const dialog = poHomeChannel.page.getByRole('dialog', { name: 'Create category' });
			await dialog.getByRole('button', { name: 'Create', exact: true }).click();
			await expect(dialog.getByText('Please enter a category name')).toBeVisible();
			await expect(dialog).toBeVisible();
			await dialog.getByRole('button', { name: 'Cancel' }).click();
		});

		test('should reject a duplicate name (case-insensitive)', async () => {
			const name = uniqueName('dup');
			await createCategory(name);

			await poHomeChannel.navbar.openCreateCategory();
			const dialog = poHomeChannel.page.getByRole('dialog', { name: 'Create category' });
			await dialog.getByRole('textbox', { name: 'Name' }).fill(name.toUpperCase());
			await dialog.getByRole('button', { name: 'Create', exact: true }).click();
			await expect(dialog.getByText('A category with this name already exists')).toBeVisible();
			await dialog.getByRole('button', { name: 'Cancel' }).click();
		});
	});

	test.describe('category emoji icon', () => {
		test('should show the folder icon for a category without an emoji', async () => {
			const name = uniqueName('folder');
			await createCategory(name);
			await expect(poHomeChannel.sidebar.getCategoryCollapser(name).locator('.rcx-icon--name-folder')).toBeVisible();
		});

		test('should show a leading icon on system groups too (aligned with custom categories)', async () => {
			// System groups carry a type icon (Channels → hashtag) so default and custom groups align.
			await expect(poHomeChannel.sidebar.getCategoryCollapser('Channels').locator('.rcx-icon--name-hashtag')).toBeVisible();
		});

		test('should let you pick an emoji shown before the category name', async ({ page }) => {
			const name = uniqueName('emoji');
			await poHomeChannel.navbar.openCreateCategory();
			const dialog = page.getByRole('dialog', { name: 'Create category' });

			await dialog.getByRole('button', { name: 'Add emoji' }).click();
			const picker = page.getByRole('dialog', { name: 'Emoji picker' });
			await expect(picker).toBeVisible();
			await picker.getByRole('textbox').first().fill('rocket');
			await page.locator('[data-emoji="rocket"]').first().click();

			await dialog.getByRole('textbox', { name: 'Name' }).fill(name);
			await dialog.getByRole('button', { name: 'Create', exact: true }).click();
			await expect(dialog).not.toBeVisible();

			// The emoji renders before the name in the collapser, replacing the default folder icon.
			const collapser = poHomeChannel.sidebar.getCategoryCollapser(name);
			await expect(collapser.locator('[class*="emojione"]')).toBeVisible();
			await expect(collapser.locator('.rcx-icon--name-folder')).toHaveCount(0);
		});

		test('should let you clear a selected emoji back to the folder icon', async ({ page }) => {
			await poHomeChannel.navbar.openCreateCategory();
			const dialog = page.getByRole('dialog', { name: 'Create category' });

			await dialog.getByRole('button', { name: 'Add emoji' }).click();
			await page.getByRole('dialog', { name: 'Emoji picker' }).getByRole('textbox').first().fill('rocket');
			await page.locator('[data-emoji="rocket"]').first().click();

			// While an emoji is set the clear badge appears; clicking it reverts to the folder icon.
			const clear = dialog.getByRole('button', { name: 'Remove' });
			await expect(clear).toBeVisible();
			await clear.click();
			await expect(dialog.getByRole('button', { name: 'Add emoji' }).locator('.rcx-icon--name-folder')).toBeVisible();
			await expect(clear).toHaveCount(0);
			await dialog.getByRole('button', { name: 'Cancel' }).click();
		});

		test('should show the category emoji in the "Move to" menu (in place of the folder)', async () => {
			const name = uniqueName('menu-emoji');
			await createCategoryWithEmoji(name);

			await poHomeChannel.sidebar.openRoomMoveToSubmenu(targetChannel);
			const item = poHomeChannel.sidebar.roomMenuMoveToItem(new RegExp(name));
			await expect(item.locator('[class*="emojione"]')).toBeVisible();
			await poHomeChannel.page.keyboard.press('Escape');
		});

		test('should keep the open room visible when its category is collapsed', async () => {
			const name = uniqueName('collapse');
			await createCategory(name);
			await poHomeChannel.sidebar.moveRoomToCategory(targetChannel, name);

			// Open the room, then collapse the category — the (read) open room stays visible.
			await poHomeChannel.sidebar.getSidebarItemByName(targetChannel).click();
			await expect(poHomeChannel.page).toHaveURL(new RegExp(targetChannel));
			await poHomeChannel.sidebar.getCategoryCollapser(name).click();

			await expect(poHomeChannel.sidebar.getCollapsedCategoryCollapser(name)).toBeVisible();
			await expect(poHomeChannel.sidebar.getSidebarItemByName(targetChannel)).toBeVisible();
		});
	});

	test.describe('category actions (custom category)', () => {
		test('should rename a category', async () => {
			const name = uniqueName('ren');
			const renamed = `${name}-renamed`;
			await createCategory(name);

			await poHomeChannel.sidebar.openCategoryMenu(name);
			await poHomeChannel.page.getByRole('menuitem', { name: 'Rename', exact: true }).click();

			const dialog = poHomeChannel.page.getByRole('dialog', { name: 'Rename category' });
			await expect(dialog).toBeVisible();
			await dialog.getByRole('textbox', { name: 'Name' }).fill(renamed);
			await dialog.getByRole('button', { name: 'Save', exact: true }).click();
			await expect(dialog).not.toBeVisible();

			await expect(poHomeChannel.sidebar.getCategoryCollapser(renamed)).toBeVisible();
			await expect(poHomeChannel.sidebar.getCategoryCollapser(name)).toHaveCount(0);
		});

		test('should delete a category and return its rooms to the system group', async () => {
			const name = uniqueName('del');
			await createCategory(name);
			await poHomeChannel.sidebar.moveRoomToCategory(targetChannel, name);
			expect(await isRoomInGrouping(name)).toBe(true);

			await poHomeChannel.sidebar.openCategoryMenu(name);
			await poHomeChannel.page.getByRole('menuitem', { name: 'Delete', exact: true }).click();

			const dialog = poHomeChannel.page.getByRole('dialog', { name: 'Delete category' });
			await expect(dialog).toBeVisible();
			await dialog.getByRole('button', { name: 'Delete', exact: true }).click();
			await expect(dialog).not.toBeVisible();

			await expect(poHomeChannel.sidebar.getCategoryCollapser(name)).toHaveCount(0);
			// The room survives and is no longer grouped (back in its system group).
			await expect(poHomeChannel.sidebar.getSidebarItemByName(targetChannel)).toBeVisible();
			expect(await isRoomInGrouping(name)).toBe(false);
		});

		test('should reorder categories with Move up', async () => {
			const first = uniqueName('ord-a');
			const second = uniqueName('ord-b');
			await createCategory(first);
			await createCategory(second);

			await poHomeChannel.sidebar.openCategoryMenu(second);
			await poHomeChannel.page.getByRole('menuitem', { name: 'Move up', exact: true }).click();

			const regions = poHomeChannel.sidebar.channelsList.getByRole('region', { name: new RegExp(`Collapse (${first}|${second})`) });
			await expect(regions.first()).toHaveAttribute('aria-label', `Collapse ${second}`);
		});

		test('should reorder categories with Move down', async () => {
			const first = uniqueName('ord-c');
			const second = uniqueName('ord-d');
			await createCategory(first);
			await createCategory(second);

			await poHomeChannel.sidebar.openCategoryMenu(first);
			await poHomeChannel.page.getByRole('menuitem', { name: 'Move down', exact: true }).click();

			const regions = poHomeChannel.sidebar.channelsList.getByRole('region', { name: new RegExp(`Collapse (${first}|${second})`) });
			await expect(regions.first()).toHaveAttribute('aria-label', `Collapse ${second}`);
		});

		test('should toggle "Show unreads"', async () => {
			const name = uniqueName('unr');
			await createCategory(name);

			await poHomeChannel.sidebar.openCategoryMenu(name);
			const toggle = poHomeChannel.page.getByRole('menuitemcheckbox', { name: 'Show unreads' });
			await expect(toggle).toBeVisible();
			await expect(toggle).toHaveAttribute('aria-checked', 'true');
			await toggle.click();
			await expect(toggle).toHaveAttribute('aria-checked', 'false');
			await poHomeChannel.page.keyboard.press('Escape');
		});

		test('should create another category from the category menu', async () => {
			const name = uniqueName('base');
			const created = uniqueName('from-menu');
			await createCategory(name);

			await poHomeChannel.sidebar.openCategoryMenu(name);
			await poHomeChannel.page.getByRole('menuitem', { name: 'New category', exact: true }).click();

			const dialog = poHomeChannel.page.getByRole('dialog', { name: 'Create category' });
			await expect(dialog).toBeVisible();
			await dialog.getByRole('textbox', { name: 'Name' }).fill(created);
			await dialog.getByRole('button', { name: 'Create', exact: true }).click();
			await expect(dialog).not.toBeVisible();
			await expect(poHomeChannel.sidebar.getCategoryCollapser(created)).toBeVisible();
		});

		test('should open the Create channel modal from "New channel"', async () => {
			const name = uniqueName('nc');
			await createCategory(name);

			await poHomeChannel.sidebar.openCategoryMenu(name);
			await poHomeChannel.page.getByRole('menuitem', { name: 'New channel', exact: true }).click();

			await expect(poHomeChannel.page.getByRole('dialog', { name: 'Create channel' })).toBeVisible();
			await poHomeChannel.page.keyboard.press('Escape');
		});
	});

	test.describe('system group actions (reduced menu)', () => {
		test('should show a reduced menu without Rename / Delete / New channel', async () => {
			await poHomeChannel.sidebar.openCategoryMenu('Channels');

			await expect(poHomeChannel.page.getByRole('menuitem', { name: 'Move up', exact: true })).toBeVisible();
			await expect(poHomeChannel.page.getByRole('menuitem', { name: 'Move down', exact: true })).toBeVisible();
			await expect(poHomeChannel.page.getByRole('menuitem', { name: 'New category', exact: true })).toBeVisible();
			await expect(poHomeChannel.page.getByRole('menuitemcheckbox', { name: 'Show unreads' })).toBeVisible();

			await expect(poHomeChannel.page.getByRole('menuitem', { name: 'Rename', exact: true })).toHaveCount(0);
			await expect(poHomeChannel.page.getByRole('menuitem', { name: 'Delete', exact: true })).toHaveCount(0);
			await expect(poHomeChannel.page.getByRole('menuitem', { name: 'New channel', exact: true })).toHaveCount(0);
			await poHomeChannel.page.keyboard.press('Escape');
		});

		test('should create a category from the system group menu', async () => {
			const created = uniqueName('from-system');
			await poHomeChannel.sidebar.openCategoryMenu('Channels');
			await poHomeChannel.page.getByRole('menuitem', { name: 'New category', exact: true }).click();

			const dialog = poHomeChannel.page.getByRole('dialog', { name: 'Create category' });
			await expect(dialog).toBeVisible();
			await dialog.getByRole('textbox', { name: 'Name' }).fill(created);
			await dialog.getByRole('button', { name: 'Create', exact: true }).click();
			await expect(dialog).not.toBeVisible();
			await expect(poHomeChannel.sidebar.getCategoryCollapser(created)).toBeVisible();
		});
	});

	test.describe('sidebar item actions', () => {
		test('should move a room into a category', async () => {
			const name = uniqueName('move');
			await createCategory(name);

			await poHomeChannel.sidebar.moveRoomToCategory(targetChannel, name);
			expect(await isRoomInGrouping(name)).toBe(true);
		});

		test('should move a room to Favorites and back', async () => {
			await poHomeChannel.sidebar.moveRoomToFavorites(targetChannel);
			expect(await isRoomInGrouping('Favorites')).toBe(true);

			await poHomeChannel.sidebar.removeRoomFromFavorites(targetChannel);
			expect(await isRoomInGrouping('Favorites')).toBe(false);
		});

		test('should remove a room from a category', async () => {
			const name = uniqueName('rm');
			await createCategory(name);
			await poHomeChannel.sidebar.moveRoomToCategory(targetChannel, name);
			expect(await isRoomInGrouping(name)).toBe(true);

			await poHomeChannel.sidebar.removeRoomFromCategory(targetChannel, name);
			expect(await isRoomInGrouping(name)).toBe(false);
		});

		test('should create a category and move the room into it in one step', async () => {
			const name = uniqueName('created');
			await poHomeChannel.sidebar.createCategoryFromRoom(targetChannel);

			const dialog = poHomeChannel.page.getByRole('dialog', { name: 'Create category' });
			await expect(dialog).toBeVisible();
			await dialog.getByRole('textbox', { name: 'Name' }).fill(name);
			// In "create and move" mode the confirm button reads "Create and move".
			await dialog.getByRole('button', { name: 'Create and move', exact: true }).click();
			await expect(dialog).not.toBeVisible();

			await expect(poHomeChannel.sidebar.getCategoryCollapser(name)).toBeVisible();
			expect(await isRoomInGrouping(name)).toBe(true);
		});

		test('should move a room into a category via drag-and-drop', async ({ page }) => {
			const name = uniqueName('dnd');
			await createCategory(name);

			const source = poHomeChannel.sidebar.getSidebarItemByName(targetChannel);
			const targetHeader = poHomeChannel.sidebar.getCategoryCollapser(name);

			const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
			await source.dispatchEvent('dragstart', { dataTransfer });
			await targetHeader.dispatchEvent('dragenter', { dataTransfer });
			await targetHeader.dispatchEvent('dragover', { dataTransfer });
			await targetHeader.dispatchEvent('drop', { dataTransfer });
			await source.dispatchEvent('dragend', { dataTransfer });

			expect(await isRoomInGrouping(name)).toBe(true);
		});
	});

	test.describe('channel header grouping', () => {
		test.beforeEach(async ({ page }) => {
			await page.goto(`/channel/${targetChannel}`);
			await expect(poHomeChannel.content.headerGroupingButton).toBeVisible();
		});

		test('should show the grouping control with the default star icon', async () => {
			await expect(poHomeChannel.content.headerGroupingIcon('star')).toBeVisible();
		});

		test('should move the room into a category from the header (icon → folder)', async () => {
			const name = uniqueName('hdr');
			await poHomeChannel.content.pickHeaderGroupingTarget('New category');

			const dialog = poHomeChannel.page.getByRole('dialog', { name: 'Create category' });
			await expect(dialog).toBeVisible();
			await dialog.getByRole('textbox', { name: 'Name' }).fill(name);
			await dialog.getByRole('button', { name: 'Create and move', exact: true }).click();
			await expect(dialog).not.toBeVisible();

			await expect(poHomeChannel.content.headerGroupingIcon('folder')).toBeVisible();
			expect(await isRoomInGrouping(name)).toBe(true);
		});

		test('should favorite the room from the header (icon → star-filled) and remove it', async () => {
			await poHomeChannel.content.pickHeaderGroupingTarget('Favorites');
			await expect(poHomeChannel.content.headerGroupingIcon('star-filled')).toBeVisible();

			await poHomeChannel.content.pickHeaderGroupingTarget('Remove from Favorites');
			await expect(poHomeChannel.content.headerGroupingIcon('star')).toBeVisible();
		});

		test('should move the room into an existing category from the header', async () => {
			const name = uniqueName('hdr-existing');
			await createCategory(name);

			await poHomeChannel.content.pickHeaderGroupingTarget(name);
			await expect(poHomeChannel.content.headerGroupingIcon('folder')).toBeVisible();
			expect(await isRoomInGrouping(name)).toBe(true);
		});

		test('should show the category emoji in the header grouping control', async ({ page }) => {
			const name = uniqueName('hdr-emoji');

			// Create-and-move into a new emoji category via the header menu.
			await poHomeChannel.content.openHeaderGroupingMenu();
			await page.getByRole('menuitem', { name: 'New category' }).click();
			const dialog = page.getByRole('dialog', { name: 'Create category' });
			await dialog.getByRole('button', { name: 'Add emoji' }).click();
			await page.getByRole('dialog', { name: 'Emoji picker' }).getByRole('textbox').first().fill('rocket');
			await page.locator('[data-emoji="rocket"]').first().click();
			await dialog.getByRole('textbox', { name: 'Name' }).fill(name);
			await dialog.getByRole('button', { name: 'Create and move', exact: true }).click();
			await expect(dialog).not.toBeVisible();

			// The header trigger now shows the category emoji instead of the folder/star icon.
			await expect(poHomeChannel.content.headerGroupingButton.locator('[class*="emojione"]')).toBeVisible();
		});
	});
});
