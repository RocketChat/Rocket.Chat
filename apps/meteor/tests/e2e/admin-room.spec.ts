import { faker } from '@faker-js/faker';

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

	test.beforeEach(async ({ page }) => {
		adminRooms = new AdminRooms(page);
		await page.goto('/admin/rooms');
	});

	test.beforeAll(async ({ api }) => {
		[channel, privateRoom] = await Promise.all([createTargetChannel(api), createTargetPrivateChannel(api)]);
	});

	test('should display the Rooms Table', async ({ page }) => {
		await expect(page.getByRole('main').getByRole('heading', { level: 1, name: 'Rooms', exact: true })).toBeVisible();
		await expect(page.getByRole('main').getByRole('table')).toBeVisible();
	});

	test('should filter room by name', async ({ page }) => {
		await adminRooms.inputSearchRooms.fill(channel);

		await expect(page.locator(`[qa-room-name="${channel}"]`)).toBeVisible();
	});

	test('should filter rooms by type', async ({ page }) => {
		const dropdown = await adminRooms.dropdownFilterRoomType();
		await dropdown.click();

		const privateOption = page.locator('text=Private channels');

		await privateOption.waitFor();
		await privateOption.click();

		const selectedDropdown = await adminRooms.dropdownFilterRoomType('Rooms (1)');
		await expect(selectedDropdown).toBeVisible();

		await expect(page.locator('text=Private Channel').first()).toBeVisible();
	});

	test('should filter rooms by type and name', async ({ page }) => {
		await adminRooms.inputSearchRooms.fill(privateRoom);

		const dropdown = await adminRooms.dropdownFilterRoomType();
		await dropdown.click();

		await page.locator('text=Private channels').click();

		await expect(page.locator(`[qa-room-name="${privateRoom}"]`)).toBeVisible();
	});

	test('should be empty in case of the search does not find any room', async ({ page }) => {
		const nonExistingChannel = faker.string.alpha(10);

		await adminRooms.inputSearchRooms.fill(nonExistingChannel);

		const dropdown = await adminRooms.dropdownFilterRoomType();
		await dropdown.click();

		await page.locator('text=Private channels').click();

		await expect(page.locator('text=No results found')).toBeVisible();
	});

	test('should filter rooms by type and name and clean the filter after changing section', async ({ page }) => {
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
