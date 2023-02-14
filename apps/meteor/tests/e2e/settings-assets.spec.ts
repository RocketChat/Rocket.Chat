import { test, expect } from './utils/test';
import { Admin } from './page-objects';

test.use({ storageState: 'admin-session.json' });

test.describe.serial('settings-assets', () => {
	let poAdmin: Admin;

	test.beforeEach(async ({ page }) => {
		poAdmin = new Admin(page);
		await page.goto('/admin/settings');

		await poAdmin.btnAssetsSettings.click();

		await expect(page.locator('[data-qa-type="PageHeader-title"]')).toHaveText('Assets');
	});

	test('expect upload and delete asset and label should be visible', async ({ page }) => {
		await expect(page.locator('[title="Assets_logo"]')).toHaveText('logo (svg, png, jpg)');

		await poAdmin.inputAssetsLogo.setInputFiles('./tests/e2e/fixtures/files/test-image.jpeg');

		await expect(page.locator('role=img[name="Asset preview"]')).toBeVisible();

		await poAdmin.btnDeleteAssetsLogo.click();

		await expect(page.locator('role=img[name="Asset preview"]')).not.toBeVisible();
	});
});
