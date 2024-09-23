import { Users } from './fixtures/userStates';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('admin-feature-preview', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/admin/feature-preview');
	});

	test('should display the correct title', async ({ page }) => {
		const title = page.locator('h1');
		await expect(title).toHaveText('Feature preview');
	});

	test('should enable the feature preview toggle', async ({ page }) => {
		const toggle = page.locator('input[name="Accounts_AllowFeaturePreview"]');

		await toggle.check();

		await expect(toggle).not.toBeDisabled();
	});

	test('should save the features when Save button is clicked', async ({ page }) => {
		const saveButton = page.locator('button', { hasText: 'Save changes' });

		const toggle = page.locator('input[name="quickReactions"]');
		await toggle.check();

		await saveButton.click();
	});

	test('should expand the accordion and display features', async ({ page }) => {
		const accordionToggle = page.locator('button', { hasText: 'Message' });
		await accordionToggle.click();

		const feature = page.locator('label', { hasText: 'quickReactions' });
		await expect(feature).toBeVisible();
	});
});
