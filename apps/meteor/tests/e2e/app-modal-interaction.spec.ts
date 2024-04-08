import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel } from './utils/create-target-channel';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('app-surfaces-interaction', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;

	test.beforeAll(async ({ api }) => {
		targetChannel = await createTargetChannel(api);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test('expect to submit an success modal', async ({ page }) => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await page.locator('role=button[name="Options"]').click();
		await page.locator('[data-key="success"]').click();
		await page.locator('role=button[name="success"]').click();

		const updatedButton = page.locator('role=button[name="success"]');
		await expect(updatedButton).not.toBeVisible();
	});

	test('expect to not close the modal and there is an error in the modal', async ({ page }) => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await page.locator('role=button[name="Options"]').click();
		await page.locator('[data-key="error"]').click();
		await page.locator('role=button[name="error"]').click();

		const updatedTitle = page.locator('role=button[name="error"]');
		expect(updatedTitle).toBeDefined();

		const input = page.locator('input[type="text"]');

		await input.click();
		await input.fill('fixed');

		await page.locator('role=button[name="error"]').click();
		await expect(input).not.toBeVisible();
	});

	test('expect to show the toaster error for modal that timeout the execution', async ({ page }) => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await page.locator('role=button[name="Options"]').click();
		await page.locator('[data-key="timeout"]').click();
		await page.locator('role=button[name="timeout"]').click();
		await page.locator('role=alert').waitFor();

		const toaster = page.locator('role=alert');

		await expect(toaster).toBeVisible();
	});

	test('expect change the modal and then submit the updated modal', async ({ page }) => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await page.locator('role=button[name="Options"]').click();
		await page.locator('[data-key="update"]').click();
		await page.locator('role=button[name="update"]').click();

		const updatedTitle = page.locator('role=button[name="title updated"]');
		expect(updatedTitle).toBeDefined();

		const updatedButton = page.locator('role=button[name="updated"]');
		expect(updatedButton).toBeDefined();
	});
});
