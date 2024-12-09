import { Users } from './fixtures/userStates';
import { setSettingValueById } from './utils/setSettingValueById';
import { setUserPreferences } from './utils/setUserPreferences';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe('Translations', () => {
	test.beforeAll(async ({ api }) => {
		await setUserPreferences(api, { language: '' });
		await setSettingValueById(api, 'Language', 'en');
		await setSettingValueById(api, 'Site_Name', 'Rocket.Chat');
	});

	test.afterAll(async ({ api }) => {
		await setUserPreferences(api, { language: '' });
		await setSettingValueById(api, 'Language', 'en');
	});

	test("expect to display text in the user's preference language", async ({ page, api }) => {
		await page.goto('/home');
		await page.waitForTimeout(5000);
		await expect(page.locator('h2')).toHaveText('Welcome to Rocket.Chat');

		const response = page.waitForResponse('**/i18n/pt-BR.json');
		await setUserPreferences(api, { language: 'pt-BR' });
		await response;
		await expect(page.locator('h2')).toHaveText('Bem-vindo ao Rocket.Chat');
		await setUserPreferences(api, { language: '' });
	});

	test('expect to keep chosen language after refresh', async ({ page, api }) => {
		await page.goto('/home');
		await expect(page.locator('h2')).toHaveText('Welcome to Rocket.Chat');

		const response = page.waitForResponse('**/i18n/pt-BR.json');
		await setUserPreferences(api, { language: 'pt-BR' });
		await response;
		await expect(page.locator('h2')).toHaveText('Bem-vindo ao Rocket.Chat');

		// Test if selected language remaing after refresh
		await page.goto('/home');
		await expect(page.locator('h2')).toHaveText('Bem-vindo ao Rocket.Chat');

		await setUserPreferences(api, { language: '' });
	});

	test.describe('Browser', async () => {
		test.use({ locale: 'pt-BR' });
		test("expect to display text in the browser's language", async ({ page }) => {
			await page.goto('/home');
			await expect(page.locator('h2')).toHaveText('Bem-vindo ao Rocket.Chat');
		});
	});
});
