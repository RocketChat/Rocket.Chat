import { Users } from './fixtures/userStates';
import { Admin } from './page-objects';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('settings-assets', () => {
	let poAdmin: Admin;

	test.beforeEach(async ({ page }) => {
		poAdmin = new Admin(page);
		await page.goto('/admin/settings');

		await poAdmin.btnAssetsSettings.click();

		await expect(page.locator('[data-qa-type="PageHeader-title"]')).toHaveText('Assets');
	});

	test('expect upload and delete logo asset and label should be visible', async ({ page }) => {
		await expect(page.locator('[title="Assets_logo"]')).toHaveText('logo (svg, png, jpg)');

		await poAdmin.inputAssetsLogo.setInputFiles('./tests/e2e/fixtures/files/test-image.jpeg');

		await expect(page.locator('role=img[name="Asset preview"]')).toBeVisible();

		await poAdmin.btnDeleteAssetsLogo.click();

		await expect(page.locator('role=img[name="Asset preview"]')).not.toBeVisible();
	});

	test('expect upload and delete logo asset for dark theme and label should be visible', async ({ page }) => {
		await expect(page.locator('[title="Assets_logo_dark"]')).toHaveText('logo - dark theme (svg, png, jpg)');

		await poAdmin.inputAssetsLogo.setInputFiles('./tests/e2e/fixtures/files/test-image.jpeg');

		await expect(page.locator('role=img[name="Asset preview"]')).toBeVisible();

		await poAdmin.btnDeleteAssetsLogo.click();

		await expect(page.locator('role=img[name="Asset preview"]')).not.toBeVisible();
	});
	test('expect upload and delete background asset and label should be visible', async ({ page }) => {
		await expect(page.locator('[title="Assets_background"]')).toHaveText('login background (svg, png, jpg)');

		await poAdmin.inputAssetsLogo.setInputFiles('./tests/e2e/fixtures/files/test-image.jpeg');

		await expect(page.locator('role=img[name="Asset preview"]')).toBeVisible();

		await poAdmin.btnDeleteAssetsLogo.click();

		await expect(page.locator('role=img[name="Asset preview"]')).not.toBeVisible();
	});
	test('expect upload and delete background asset for dark theme and label should be visible', async ({ page }) => {
		await expect(page.locator('[title="Assets_background_dark"]')).toHaveText('login background - dark theme (svg, png, jpg)');

		await poAdmin.inputAssetsLogo.setInputFiles('./tests/e2e/fixtures/files/test-image.jpeg');

		await expect(page.locator('role=img[name="Asset preview"]')).toBeVisible();

		await poAdmin.btnDeleteAssetsLogo.click();

		await expect(page.locator('role=img[name="Asset preview"]')).not.toBeVisible();
	});
});
