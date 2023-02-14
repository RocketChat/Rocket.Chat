import { test, expect } from './utils/test';
import { HomeDiscussion } from './page-objects';
import { IS_EE } from './config/constants';

test.use({ storageState: 'admin-session.json' });

test.describe.serial('administration-menu', () => {
	let poHomeDiscussion: HomeDiscussion;

	test.beforeEach(async ({ page }) => {
		poHomeDiscussion = new HomeDiscussion(page);

		await page.goto('/home');
	});

	test('expect open upgrade page', async ({ page }) => {
		test.skip(IS_EE, 'Community Only');
		await poHomeDiscussion.sidenav.openAdministrationByLabel('Go fully featured');

		await expect(page).toHaveURL('admin/upgrade/go-fully-featured');
	});

	test('expect open info page', async ({ page }) => {
		await poHomeDiscussion.sidenav.openAdministrationByLabel('Workspace');

		await expect(page).toHaveURL('admin/info');
	});

	test('expect open omnichannel page', async ({ page }) => {
		await poHomeDiscussion.sidenav.openAdministrationByLabel('Omnichannel');

		await expect(page).toHaveURL('omnichannel/current');
	});

	test('expect open app marketplace page', async ({ page }) => {
		await poHomeDiscussion.sidenav.openAdministrationByLabel('Marketplace');

		await expect(page).toHaveURL('admin/marketplace/all/list');
	});

	test('expect open app installed page', async ({ page }) => {
		await poHomeDiscussion.sidenav.openAdministrationByLabel('Installed');

		await expect(page).toHaveURL('admin/marketplace/installed/list');
	});

	test.describe('user', () => {
		test.use({ storageState: 'user1-session.json' });

		test('expect to not render administration menu when no permission', async ({ page }) => {
			await expect(page.locator('role=button[name="Administration"]')).not.toBeVisible();
		});
	});
});
