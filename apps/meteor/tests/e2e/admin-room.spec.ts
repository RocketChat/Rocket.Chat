import { faker } from '@faker-js/faker';
import type { BrowserContext, Page } from 'playwright-core';

import { Users } from './fixtures/userStates';
import { AdminInfo, AdminRooms, AdminSectionsHref } from './page-objects';
import { createTargetChannel, createTargetPrivateChannel } from './utils';
import { expect, test } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('admin-rooms', () => {
	let channel: string;
	let privateRoom: string;
	let adminRooms: AdminRooms;
	let adminInfo: AdminInfo;
	let page: Page;
	let context: BrowserContext;

	test.beforeAll(async ({ browser, api }) => {
		[channel, privateRoom] = await Promise.all([createTargetChannel(api), createTargetPrivateChannel(api)]);
		context = await browser.newContext({ storageState: Users.admin.state });
		page = await context.newPage();
		adminRooms = new AdminRooms(page);
	});

	test.afterAll(async () => {
		await page.close();
		await context.close();
	});

	test.beforeEach(async () => {
		await page.goto('/admin/rooms');
	});

	test('should display the Rooms Table', async () => {
		await expect(page.getByRole('main').getByRole('heading', { level: 1, name: 'Rooms', exact: true })).toBeVisible();
		await expect(page.getByRole('main').getByRole('table')).toBeVisible();
	});

	test('should filter room by name', async () => {
		await adminRooms.inputSearchRooms.fill(channel);

		await expect(page.locator(`[qa-room-name="${channel}"]`)).toBeVisible();
	});

	test('should filter rooms by type', async () => {
		const dropdown = await adminRooms.dropdownFilterRoomType();
		await dropdown.click();

		const privateOption = page.locator('text=Private channels');

		await privateOption.waitFor();
		await privateOption.click();

		const selectedDropdown = await adminRooms.dropdownFilterRoomType('Rooms (1)');
		await expect(selectedDropdown).toBeVisible();

		await expect(page.locator('text=Private Channel').first()).toBeVisible();
	});

	test('should filter rooms by type and name', async () => {
		await adminRooms.inputSearchRooms.fill(privateRoom);

		const dropdown = await adminRooms.dropdownFilterRoomType();
		await dropdown.click();

		await page.locator('text=Private channels').click();

		await expect(page.locator(`[qa-room-name="${privateRoom}"]`)).toBeVisible();
	});

	test('should be empty in case of the search does not find any room', async () => {
		const nonExistingChannel = faker.string.alpha(10);

		await adminRooms.inputSearchRooms.fill(nonExistingChannel);

		const dropdown = await adminRooms.dropdownFilterRoomType();
		await dropdown.click();

		await page.locator('text=Private channels').click();

		await expect(page.locator('text=No results found')).toBeVisible();
	});

	test('should filter rooms by type and name and clean the filter after changing section', async () => {
		adminInfo = new AdminInfo(page);

		await adminRooms.inputSearchRooms.fill(privateRoom);
		const dropdown = adminRooms.dropdownFilterRoomType();
		await dropdown.click();

		await page.locator('text=Private channels').click();

		const workspaceButton = await adminRooms.adminSectionButton(AdminSectionsHref.Workspace);
		await workspaceButton.click();
		await expect(adminInfo.adminPageContent).toBeVisible();

		const roomsButton = await adminRooms.adminSectionButton(AdminSectionsHref.Rooms);
		await roomsButton.click();

		const selectDropdown = await adminRooms.dropdownFilterRoomType('All rooms');
		await expect(selectDropdown).toBeVisible();
	});
});
