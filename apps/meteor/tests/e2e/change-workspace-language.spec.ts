import { Users } from './fixtures/userStates';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe('setting-language', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/settings/General');
	});

  test.afterAll(async ({ api }) => {
    await api.post('/settings/Language', { value: 'en' });
  });

  test('Change workspace language', async ({ page }) => {
    const languageDropdownSelector = page.locator('button#Language');
    const languageOption = page.locator('text=Brazilian Portuguese');
    const saveChangesButton = page.locator('button[type="submit"]');
    const settingsPageTitle = page.locator('[data-qa-type="PageHeader-title"]');

    await expect(settingsPageTitle).toHaveText(/General.*/);
    await languageDropdownSelector.click();
    await languageOption.click();
    await saveChangesButton.click();

    await expect(settingsPageTitle).toHaveText(/Geral.*/);
  });

  test('Change workspace language to default language', async ({ page }) => {
    const resetButton = page.locator('[data-qa-reset-setting-id="Language"]');
    const saveChangesButton = page.locator('button[type="submit"]');
    const settingsPageTitle = page.locator('[data-qa-type="PageHeader-title"]');

    await expect(settingsPageTitle).toHaveText(/Geral.*/);
    await resetButton.click();
    await saveChangesButton.click();

    await expect(settingsPageTitle).toHaveText(/General.*/);
  });
});
