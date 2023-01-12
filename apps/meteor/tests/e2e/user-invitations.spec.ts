import { test, expect } from './utils/test';

test.use({ storageState: 'admin-session.json' });

test.describe.serial('user-invites', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/admin/users/invite');

		await expect(page.locator('[data-qa-type="VerticalBarText"]')).toHaveText('Invite Members');
	});

	test('expect SMTP setup warning and routing to email settings', async ({ page }) => {
		await expect(page.locator('role=link[name="Set up SMTP"]')).toBeVisible();

		await page.locator('role=link[name="Set up SMTP"]').click();

		await expect(page).toHaveURL('/admin/settings/Email');
	});
});
