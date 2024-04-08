import { Page } from '@playwright/test';

import { Users } from './fixtures/userStates';
import { createTargetChannel, createTargetPrivateChannel } from './utils';
import { expect, test } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('admin-rooms', () => {
	let adminPage: Page;
	let channel: string;
	let privateRoom: string;

	test.beforeEach(async ({ page }) => {
		await page.goto('/admin/rooms');
	});

	test.beforeAll(async ({ browser, api }) => {
		adminPage = await browser.newPage({ storageState: Users.admin.state });
		await adminPage.goto('/home');
		await adminPage.waitForSelector('[data-qa-id="home-header"]');

		channel = await createTargetChannel(api);
		privateRoom = await createTargetPrivateChannel(api);
	});
	test('should display the Rooms Table', async ({ page }) => {
		await expect(page.locator('[data-qa-type="PageHeader-title"]')).toContainText('Rooms');
		await expect(page.locator(`[qa-room-name="${privateRoom}"]`)).toBeVisible();
		await expect(page.locator(`[qa-room-name="${channel}"]`)).toBeVisible();
	});

	test('should filter room by name', async ({ page }) => {
		const input = page.locator('input[type="text"]');
		console.log('🚀 ~ test ~ channel:', channel);

		await input.click();
		await input.fill(channel);

		await expect(page.locator(`[qa-room-name="${channel}"]`)).toBeVisible();
	});

	test('should filter rooms by type', async ({ page }) => {
		const dropdown = page.locator('text=All rooms');
		await dropdown.click();

		const privateOption = page.locator('text=Private channels');

		await privateOption.waitFor();
		await privateOption.click();

		await expect(page.locator(`[qa-room-name="${privateRoom}"]`)).toBeVisible();
	});

	test('should filter rooms by type and name', async ({ page }) => {
		const input = page.locator('input[type="text"]');

		await input.click();
		await input.fill(privateRoom);

		const dropdown = page.locator('text=All rooms');
		await dropdown.click();

		const privateOption = page.locator('text=Private channels');

		await privateOption.waitFor();
		await privateOption.click();

		await expect(page.locator(`[qa-room-name="${privateRoom}"]`)).toBeVisible();
	});

	test('should be empty in case of the search does not find any room', async ({ page }) => {
		const input = page.locator('input[type="text"]');

		await input.click();
		await input.fill('Wrong-channel');

		const dropdown = page.locator('text=All rooms');
		await dropdown.click();

		const privateOption = page.locator('text=Private channels');

		await privateOption.waitFor();
		await privateOption.click();

		await expect(page.locator('text=No results found')).toBeVisible();
	});

	test.only('should filter rooms by type and name and keep the filter after changing section', async ({ page }) => {
		const input = page.locator('input[type="text"]');

		await input.click();
		await input.fill(privateRoom);

		const dropdown = page.locator('text=All rooms');
		await dropdown.click();

		const privateOption = page.locator('text=Private channels');

		await privateOption.waitFor();
		await privateOption.click();

		await page.locator('text=Workspace').click();

		await page.locator('text=Rooms').click();

		const selectDropdown = page.locator('text=Rooms (1)');
		await expect(selectDropdown).toBeVisible();

		await selectDropdown.click();

		const isChecked = await privateOption.isChecked();

		expect(isChecked).toBe(true);

		await expect(input).toHaveValue(privateRoom);
	});
});
