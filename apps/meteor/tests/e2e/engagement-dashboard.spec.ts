import { test, expect } from './utils/test';
import { IS_EE } from './config/constants';

test.skip(!IS_EE, 'Engagemente Dashboard > Enterprise Only');

test.use({ storageState: 'admin-session.json' });

test.describe('engagement-dashboard', () => {
	test.describe.parallel('expect to trigger fallback error component', () => {
		test.beforeEach(async ({ page }) => {
			await page.goto('/admin/engagement-dashboard');
			await page.route('**/api/v1/engagement-dashboard/**', (route) => route.abort());
		});

		test('expect to show 4 fallback errors components inside widget at Users Tab', async ({ page }) => {
			await expect(
				page.locator('[data-qa-id="EngagementDashboardPage-usersTab"][aria-selected="true"]', { hasText: 'Users' }),
			).toBeVisible();

			await page.waitForSelector('[data-qa="EngagementDashboardCardErrorBoundary"]');
			await expect(page.locator('[data-qa="EngagementDashboardCardErrorBoundary"]')).toHaveCount(4);
		});

		test('expect to show 2 fallback errors components inside widget at Messages Tab', async ({ page }) => {
			await page.locator('[data-qa-id="EngagementDashboardPage-messagesTab"]').click();
			await expect(
				page.locator('[data-qa-id="EngagementDashboardPage-messagesTab"][aria-selected="true"]', { hasText: 'Messages' }),
			).toBeVisible();

			await page.waitForSelector('[data-qa="EngagementDashboardCardErrorBoundary"]');
			await expect(page.locator('[data-qa="EngagementDashboardCardErrorBoundary"]')).toHaveCount(2);
		});

		test('expect to show a fallback error component inside widget at Channels Tab', async ({ page }) => {
			await page.locator('[data-qa-id="EngagementDashboardPage-channelsTab"]').click();
			await expect(
				page.locator('[data-qa-id="EngagementDashboardPage-channelsTab"][aria-selected="true"]', { hasText: 'Channels' }),
			).toBeVisible();

			await page.waitForSelector('[data-qa="EngagementDashboardCardErrorBoundary"]');
			await expect(page.locator('[data-qa="EngagementDashboardCardErrorBoundary"]')).toBeVisible();
		});
	});
});
