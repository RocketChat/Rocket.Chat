import { Users } from './fixtures/userStates';
import { test, expect } from './utils/test';

test.describe('setting-language', () => {
	test.beforeAll(async ({ api }) => {
		await api.post('/settings/Language', { value: '' });
	});

	test.afterAll(async ({ api }) => {
		await api.post('/settings/Language', { value: '' });
	});

	test('Change workspace language', async ({ browser }) => {
		const context = await browser.newContext({ locale: 'es-ES', storageState: Users.admin.state });
		const page = await context.newPage();
		await page.goto('/admin/settings/General');

		await test.step('expect to be in spanish', async () => {
			const settingLabel = page.locator('label[for="Language"]');
			await expect(settingLabel).toHaveText('Idioma');
		});

		await test.step('expect to be change language to english', async () => {
			const languageDropdownSelector = page.locator('button#Language');
			const languageOption = page.locator('text=Inglés');
			const saveChangesButton = page.locator('button[type="submit"]');
			const settingLabel = page.locator('label[for="Language"]');

			await languageDropdownSelector.click();
			await languageOption.click();
			await saveChangesButton.click();

			await expect(settingLabel).toHaveText('Language');
		});
	});
});
