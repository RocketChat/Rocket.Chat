import { faker } from '@faker-js/faker';

import { IS_EE } from './config/constants';
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel, deleteChannel, setSettingValueById, setUserPreferences } from './utils';
import { preserveSettings } from './utils/preserveSettings';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

const setSidebarRail = (api: Parameters<typeof setUserPreferences>[0], value: boolean) =>
	setUserPreferences(api, { featuresPreview: [{ name: 'sidebarRail', value }] });

test.describe.serial('sidebar rail: Inbox search', () => {
	let poHomeChannel: HomeChannel;
	const searchTerm = faker.string.alpha({ length: 10, casing: 'lower' });
	let matchingChannel: string;
	let otherChannel: string;

	preserveSettings(['Accounts_AllowFeaturePreview']);

	test.beforeAll(async ({ api }) => {
		matchingChannel = `${searchTerm}-${faker.string.uuid().slice(0, 8)}`;
		await api.post('/channels.create', { name: matchingChannel });
		otherChannel = await createTargetChannel(api);
		await setSettingValueById(api, 'Accounts_AllowFeaturePreview', true);
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([deleteChannel(api, matchingChannel), deleteChannel(api, otherChannel), setSidebarRail(api, false)]);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
	});

	test.describe('with the preview on', () => {
		test.beforeAll(async ({ api }) => {
			await setSidebarRail(api, true);
		});

		test.beforeEach(async () => {
			await poHomeChannel.goto();
		});

		test('should list only the rooms whose name matches, and show every room again on Esc', async () => {
			const { sidebar } = poHomeChannel;

			await test.step('open the search from the Inbox header', async () => {
				await expect(sidebar.inboxHeading).toBeVisible();
				await sidebar.btnSearchRooms.click();
				await expect(sidebar.inputSearchRooms).toBeFocused();
			});

			await test.step('type part of a room name', async () => {
				await sidebar.inputSearchRooms.fill(searchTerm.toUpperCase());
				await expect(sidebar.getSidebarItemByName(matchingChannel)).toBeVisible();
				await expect(sidebar.getSidebarItemByName(otherChannel)).not.toBeVisible();
			});

			await test.step('type a name no room has', async () => {
				await sidebar.inputSearchRooms.fill(faker.string.uuid());
				await expect(sidebar.searchNoResults).toBeVisible();
			});

			await test.step('close the search with Esc', async () => {
				await sidebar.inputSearchRooms.press('Escape');
				await expect(sidebar.inputSearchRooms).not.toBeVisible();
				await expect(sidebar.getSidebarItemByName(matchingChannel)).toBeVisible();
				await expect(sidebar.getSidebarItemByName(otherChannel)).toBeVisible();
			});
		});

		test('should not have any accessibility violations in the sidebar with the search open', async ({ makeAxeBuilder }) => {
			await poHomeChannel.sidebar.btnSearchRooms.click();
			await poHomeChannel.sidebar.inputSearchRooms.fill(searchTerm);
			await expect(poHomeChannel.sidebar.getSidebarItemByName(matchingChannel)).toBeVisible();

			const results = await makeAxeBuilder().include('nav[aria-label="Sidebar"]').analyze();
			expect(results.violations).toEqual([]);
		});

		test.describe('dragging while filtering', () => {
			test.skip(!IS_EE, 'Enterprise Only');

			const category = `category-${faker.string.uuid().slice(0, 8)}`;
			let categorizedChannel: string;

			test.beforeAll(async ({ api }) => {
				categorizedChannel = `${searchTerm}-${faker.string.uuid().slice(0, 8)}`;
				await api.post('/channels.create', { name: categorizedChannel });
				await setUserPreferences(api, { sidebarCategories: [{ _id: faker.string.uuid(), name: category }] });
			});

			test.afterAll(async ({ api }) => {
				await Promise.all([deleteChannel(api, categorizedChannel), setUserPreferences(api, { sidebarCategories: [] })]);
			});

			test('should move a room into a category, but not reorder the categories', async () => {
				const { sidebar } = poHomeChannel;
				let orderWhileFiltering: string[] = [];

				await test.step('filter with a category and another group in the list', async () => {
					await sidebar.moveRoomToCategory(categorizedChannel, category);
					await sidebar.btnSearchRooms.click();
					await sidebar.inputSearchRooms.fill(searchTerm);
					await expect(sidebar.getCategoryCollapser(category)).toBeVisible();
					await expect(sidebar.getSidebarItemByName(matchingChannel)).toBeVisible();
					orderWhileFiltering = await sidebar.getCategoryOrder();
				});

				await test.step('dragging the category header leaves the order as it was', async () => {
					const otherGroup = orderWhileFiltering.find((name) => name !== category);
					expect(otherGroup).toBeDefined();

					await sidebar.dragCategoryAbove(category, otherGroup as string);

					await expect.poll(() => sidebar.getCategoryOrder()).toEqual(orderWhileFiltering);
				});

				await test.step('dragging a room onto the category moves it there', async () => {
					await sidebar.dragRoomToCategory(matchingChannel, category);

					await poHomeChannel.gotoChannel(matchingChannel);
					expect(await poHomeChannel.content.header.checkRoomBelongsToGroup(`Remove from ${category}`, true)).toBe(true);
				});
			});
		});
	});

	test.describe('with the preview off', () => {
		test.beforeAll(async ({ api }) => {
			await setSidebarRail(api, false);
		});

		test('should show the room list without the Inbox header', async () => {
			await poHomeChannel.goto();

			await expect(poHomeChannel.sidebar.getSidebarItemByName(matchingChannel)).toBeVisible();
			await expect(poHomeChannel.sidebar.inboxHeading).not.toBeVisible();
			await expect(poHomeChannel.sidebar.btnSearchRooms).not.toBeVisible();
		});
	});
});
