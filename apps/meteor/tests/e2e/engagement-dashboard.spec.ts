import { IS_EE } from './config/constants';
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects/home-channel';
import { test, expect } from './utils/test';

test.skip(!IS_EE, 'Engagement Dashboard > Enterprise Only');

test.use({ storageState: Users.admin.state });
let poHomeChannel: HomeChannel;

test.describe('engagement-dashboard', () => {
	test.beforeEach(async ({ page }) => {
		poHomeChannel = await new HomeChannel(page);

		await page.goto('/home');
		await poHomeChannel.sidenav.openAdministrationByLabel('Workspace')
		await page.route('**/api/v1/engagement-dashboard/**', (route) => route.abort());
		await page.locator('a[href="/admin/engagement/users"]').click();
	});
	test('expect to trigger fallback error component', async ({ page }) => {
		await test.step('expect to show 4 fallback errors components inside widget at Users Tab', async () => {
			await expect(page.locator('role=tab[name="Users"][selected]')).toBeVisible();

			await page.waitForSelector('[data-qa="EngagementDashboardCardErrorBoundary"]');
			await expect(page.locator('[data-qa="EngagementDashboardCardErrorBoundary"]')).toHaveCount(4);
		});

		await test.step('expect to show 2 fallback errors components inside widget at Messages Tab', async () => {
			await page.locator('role=tab[name="Messages"]').click();
			await expect(page.locator('role=tab[name="Messages"][selected]')).toBeVisible();

			await page.waitForSelector('[data-qa="EngagementDashboardCardErrorBoundary"]');
			await expect(page.locator('[data-qa="EngagementDashboardCardErrorBoundary"]')).toHaveCount(2);
		});

		await test.step('expect to show a fallback error component inside widget at Channels Tab', async () => {
			await page.locator('role=tab[name="Channels"]').click();
			await expect(page.locator('role=tab[name="Channels"][selected]')).toBeVisible();

			await page.waitForSelector('[data-qa="EngagementDashboardCardErrorBoundary"]');
			await expect(page.locator('[data-qa="EngagementDashboardCardErrorBoundary"]')).toBeVisible();
		});
	});
});
