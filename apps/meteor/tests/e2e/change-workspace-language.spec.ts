import { Users } from './fixtures/userStates';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('setting-language', () => {
  
  test.beforeEach(async ({ api }) => {
    const response = await api.post('/settings/Language', { value: 'en' });
    expect(response.status()).toBe(200);
	});

  test.afterEach(async ({ api }) => {
    const response = await api.post('/settings/Language', { value: 'en' });
    expect(response.status()).toBe(200);
  });

  test.afterAll(async ({ api }) => {
    await api.post('/settings/Language', { value: 'en' });
  });

  test('Change workspace language', async ({ page }) => {
    const languageDropdownSelector = page.locator('button#Language');
    const languageOption = page.locator('text=Brazilian Portuguese');
    const saveChangesButton = page.locator('button[type="submit"]');
    const settingsPageTitle = page.locator('[data-qa-type="PageHeader-title"]');

    await page.goto('/admin/settings/General');
    await expect(settingsPageTitle).toHaveText(/General.*/);
    await languageDropdownSelector.click();
    await languageOption.click();
    await saveChangesButton.click();

    await expect(settingsPageTitle).toHaveText(/Geral.*/);
  });

  test('Change workspace language to default language', async ({ page, api }) => {
    const resetButton = page.locator('[data-qa-reset-setting-id="Language"]');
    const saveChangesButton = page.locator('button[type="submit"]');
    const settingsPageTitle = page.locator('[data-qa-type="PageHeader-title"]');

    await test.step('Change language to Portuguese first', async () => {
      const response = await api.post('/settings/Language', { value: 'pt' });
      expect(response.status()).toBe(200);
    });

    await test.step('Change language to default language', async () => {
      await page.goto('/admin/settings/General');
      await expect(settingsPageTitle).toHaveText(/Geral.*/);
      await resetButton.click();
      await saveChangesButton.click();

      await expect(settingsPageTitle).toHaveText(/General.*/);
    });
  });
});
