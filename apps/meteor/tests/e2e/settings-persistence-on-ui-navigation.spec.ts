import { Users } from './fixtures/userStates';
import { setSettingValueById } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('settings-persistence-on-ui-navigation', () => {
	test.beforeAll(({ api }) => setSettingValueById(api, 'Hide_System_Messages', []));

	test.beforeEach(async ({ page }) => {
		await page.goto('/admin/settings/Message');

		// Intercept the API call and delay its response
		await page.route('/api/v1/method.call/saveSettings', async (route) => {
			const response = await route.fetch();
			await new Promise((resolve) => setTimeout(resolve, 2000)); // Delay the response by 2 seconds
			return route.fulfill({
				response,
				status: response.status(),
				headers: response.headers(),
				body: await response.body(),
			});
		});
	});

	test.afterAll(({ api }) => setSettingValueById(api, 'Hide_System_Messages', []));

	test('expect settings to persist in ui when navigating back and forth', async ({ page }) => {
		const settingInput = await page.locator('[data-qa-setting-id="Hide_System_Messages"] input');
		await settingInput.pressSequentially('User joined');
		await settingInput.press('Enter');

		await page.locator('button:has-text("Save changes")').click();
		await page.locator('button[title="Back"]').click();

		await page.waitForResponse((response) => response.url().includes('/api/v1/method.call/saveSettings') && response.status() === 200);

		await page.locator('a[href="/admin/settings/Message"] >> text=Open').click();

		await expect(page.locator('label[for="Hide_System_Messages"][title="Hide_System_Messages"]')).toBeVisible();
	});
});
