import { test, expect } from './utils/test';
import { Admin } from './page-objects';
import { IS_EE } from './config/constants';

test.use({ storageState: 'admin-session.json' });

test.describe('engagement-dashboard', () => {
	let poAdmin: Admin;

	test.describe('Engagement Dashboard Error Component', () => {
		test.skip(!IS_EE, 'Enterprise Only');

		test.beforeEach(async ({ page }) => {
			poAdmin = new Admin(page);
			await page.goto('/admin');

			await page.route('**/api/v1/engagement-dashboard/**', (route) => route.abort());
			await poAdmin.sidenav.linkEngagementDashboard.click();
			await expect(page.locator('[data-qa="EngagementDashboardPage"]')).toBeVisible();
		});

		test('Users Tab: Check for Error component on widget error', async ({ page }) => {
			await expect(
				page.locator('[data-qa-id="EngagementDashboardPage-usersTab"][aria-selected="true"]', { hasText: 'Users' }),
			).toBeVisible();

			await page.waitForSelector('[data-qa="EngagementDashboardCardErrorBoundary"]');
			await expect(page.locator('[data-qa="EngagementDashboardCardErrorBoundary"]')).toHaveCount(4);
		});

		test('Messages Tab: Check for Error component on widget error', async ({ page }) => {
			await page.locator('[data-qa-id="EngagementDashboardPage-messagesTab"]').click();
			await expect(
				page.locator('[data-qa-id="EngagementDashboardPage-messagesTab"][aria-selected="true"]', { hasText: 'Messages' }),
			).toBeVisible();

			await page.waitForSelector('[data-qa="EngagementDashboardCardErrorBoundary"]');
			await expect(page.locator('[data-qa="EngagementDashboardCardErrorBoundary"]')).toHaveCount(2);
		});

		test('Channels Tab: Check for Error component on widget error', async ({ page }) => {
			await page.locator('[data-qa-id="EngagementDashboardPage-channelsTab"]').click();
			await expect(
				page.locator('[data-qa-id="EngagementDashboardPage-channelsTab"][aria-selected="true"]', { hasText: 'Channels' }),
			).toBeVisible();

			await page.waitForSelector('[data-qa="EngagementDashboardCardErrorBoundary"]');
			await expect(page.locator('[data-qa="EngagementDashboardCardErrorBoundary"]')).toBeVisible();
		});
	});
});
