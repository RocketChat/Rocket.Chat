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
    const languageOption = page.locator('text=Spanish');
    const saveChangesButton = page.locator('button[type="submit"]');
    const welcomeTextLocator = page.locator('[data-qa-id="homepage-welcome-text"]');

    await test.step('Expect workspace language to be in English initially', async () => {
      await page.goto('/home');
      await expect(welcomeTextLocator).toHaveText(/Welcome to.*/);
    });

    await test.step('Change language from English to Spanish', async () => {
      await page.goto('/admin/settings/General');
      await languageDropdownSelector.click();
      await languageOption.click();
      await saveChangesButton.click();
      await page.waitForTimeout(3000);

      await page.goto('/home');
      await expect(welcomeTextLocator).toHaveText(/Te damos la bienvenida a.*/);
    });
  });

  test('Change workspace language to default language', async ({ page, api }) => {
    const welcomeTextLocator = page.locator('[data-qa-id="homepage-welcome-text"]');
    const resetButton = page.locator('[data-qa-reset-setting-id="Language"]');
    const saveChangesButton = page.locator('button[type="submit"]');

    await test.step('Change language to Spanish first', async () => {
      const response = await api.post('/settings/Language', { value: 'es' });
      expect(response.status()).toBe(200);
    });

    await test.step('Change language to default language', async () => {
      await page.goto('/admin/settings/General');
      await resetButton.click();
      await saveChangesButton.click();
      await page.waitForTimeout(3000);

      await page.goto('/home');
      await expect(welcomeTextLocator).toHaveText(/Welcome to.*/);
    });
  });
});
