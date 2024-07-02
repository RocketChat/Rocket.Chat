import { Users } from './fixtures/userStates';
import { Admin } from './page-objects';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('settings-int', () => {
	let poAdmin: Admin;

	test.beforeEach(async ({ page }) => {
		poAdmin = new Admin(page);
		await page.goto('/admin/settings/Message');

		await expect(page.locator('[data-qa-type="PageHeader-title"]')).toHaveText('Message');
	});

	test('expect not being able to set int value as empty string', async ({ page }) => {
		await page.locator('#Message_AllowEditing_BlockEditInMinutes').fill('');
		await page.locator('#Message_AllowEditing_BlockEditInMinutes').blur();

		await poAdmin.btnSaveSettings.click();

		await expect(page.locator('.rcx-toastbar.rcx-toastbar--error')).toBeVisible();
	});
});
