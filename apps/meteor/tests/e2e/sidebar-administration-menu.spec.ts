import { IS_EE } from './config/constants';
import { Users } from './fixtures/userStates';
import { HomeDiscussion } from './page-objects';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('sidebar-administration-menu', () => {
	let poHomeDiscussion: HomeDiscussion;

	test.beforeEach(async ({ page }) => {
		poHomeDiscussion = new HomeDiscussion(page);

		await page.goto('/home');
	});

	test.describe('admin user', () => {
		test.skip(!IS_EE, 'Enterprise only');
		test('should open workspace page', async ({ page }) => {
			await poHomeDiscussion.navbar.openManageMenuItem('Workspace');
			await expect(page).toHaveURL('admin/info');
		});

		test('should open omnichannel page', async ({ page }) => {
			await poHomeDiscussion.navbar.openManageMenuItem('Omnichannel');
			await expect(page).toHaveURL('omnichannel/current');
		});
	});

	test.describe('regular user', () => {
		test.use({ storageState: Users.user1.state });

		test('expect to not render administration menu when no permission', async () => {
			await expect(poHomeDiscussion.navbar.btnManageWorkspace).not.toBeVisible();
		});
	});
});
