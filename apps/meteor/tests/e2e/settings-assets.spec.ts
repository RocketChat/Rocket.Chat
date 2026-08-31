import { Users } from './fixtures/userStates';
import { AdminSettings } from './page-objects';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('settings-assets', () => {
	let poAdminSettings: AdminSettings;

	test.beforeEach(async ({ page }) => {
		poAdminSettings = new AdminSettings(page);
		await page.goto('/admin/settings');

		await poAdminSettings.btnAssetsSettings.click();

		await expect(page.getByRole('main').getByRole('heading', { level: 1, name: 'Assets', exact: true })).toBeVisible();
	});

	test('expect upload and delete logo asset and label should be visible', async ({ page }) => {
		await expect(page.locator('[title="Assets_logo"]')).toHaveText('logo (svg, png, jpg)');

		await poAdminSettings.inputAssetsLogo.setInputFiles('./tests/e2e/fixtures/files/test-image.jpeg');

		await expect(page.locator('role=img[name="Asset preview"]')).toBeVisible();

		await poAdminSettings.btnDeleteAssetsLogo.click();

		await expect(page.locator('role=img[name="Asset preview"]')).not.toBeVisible();
	});

	test('expect upload and delete logo asset for dark theme and label should be visible', async ({ page }) => {
		await expect(page.locator('[title="Assets_logo_dark"]')).toHaveText('logo - dark theme (svg, png, jpg)');

		await poAdminSettings.inputAssetsLogo.setInputFiles('./tests/e2e/fixtures/files/test-image.jpeg');

		await expect(page.locator('role=img[name="Asset preview"]')).toBeVisible();

		await poAdminSettings.btnDeleteAssetsLogo.click();

		await expect(page.locator('role=img[name="Asset preview"]')).not.toBeVisible();
	});
	test('expect upload and delete background asset and label should be visible', async ({ page }) => {
		await expect(page.locator('[title="Assets_background"]')).toHaveText('login background (svg, png, jpg)');

		await poAdminSettings.inputAssetsLogo.setInputFiles('./tests/e2e/fixtures/files/test-image.jpeg');

		await expect(page.locator('role=img[name="Asset preview"]')).toBeVisible();

		await poAdminSettings.btnDeleteAssetsLogo.click();

		await expect(page.locator('role=img[name="Asset preview"]')).not.toBeVisible();
	});
	test('expect upload and delete background asset for dark theme and label should be visible', async ({ page }) => {
		await expect(page.locator('[title="Assets_background_dark"]')).toHaveText('login background - dark theme (svg, png, jpg)');

		await poAdminSettings.inputAssetsLogo.setInputFiles('./tests/e2e/fixtures/files/test-image.jpeg');

		await expect(page.locator('role=img[name="Asset preview"]')).toBeVisible();

		await poAdminSettings.btnDeleteAssetsLogo.click();

		await expect(page.locator('role=img[name="Asset preview"]')).not.toBeVisible();
	});
});
