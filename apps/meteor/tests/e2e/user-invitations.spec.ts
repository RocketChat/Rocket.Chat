import { Users } from './fixtures/userStates';
import { Admin } from './page-objects';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('user-invites', () => {
	let poAdmin: Admin;

	test.beforeEach(async ({ page }) => {
		poAdmin = new Admin(page);
		await page.goto('/admin/users/invite');

		await expect(poAdmin.tabs.users.inviteUsersTitle).toBeVisible();
	});

	test('expect SMTP setup warning and routing to email settings', async ({ page }) => {
		await expect(poAdmin.tabs.users.setupSmtpLink).toBeVisible();

		await poAdmin.tabs.users.setupSmtpLink.click();

		await expect(page).toHaveURL('/admin/settings/Email');
	});
});
