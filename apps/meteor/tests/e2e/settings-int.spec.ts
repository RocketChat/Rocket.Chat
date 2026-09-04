import { Users } from './fixtures/userStates';
import { AdminSettings } from './page-objects';
import { test } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('settings-int', () => {
	let poAdminSettings: AdminSettings;

	test.beforeEach(async ({ page }) => {
		poAdminSettings = new AdminSettings(page);

		await poAdminSettings.gotoSection('Message');
	});

	test('expect not being able to set int value as empty string', async ({ page }) => {
		await page.locator('#Message_AllowEditing_BlockEditInMinutes').fill('');
		await page.locator('#Message_AllowEditing_BlockEditInMinutes').blur();

		await poAdminSettings.btnSaveChanges.click();
		await poAdminSettings.toastMessage.waitForDisplay({ type: 'error' });
	});
});
