import { Users } from './fixtures/userStates';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('setting-language', () => {

	test.beforeEach(async ({ page, api }) => {
		await page.goto('/home');
    const response = await api.post('/settings/Language', { value: 'en' });
    expect(response.status()).toBe(200);
	});

  test.afterEach(async ({ api }) => {
    const response = await api.post('/settings/Language', { value: 'en' });
    expect(response.status()).toBe(200);
  });

  test.afterAll(async ({ api }) => {
    const response = await api.post('/settings/Language', { value: 'en' });
    expect(response.status()).toBe(200);
  });

  test('Change workspace language', async ({ page, api }) => {
    await test.step('expect welcomeTextLocator to be in English initially', async () => {
      const welcomeTextLocator = page.locator('[data-qa-id="homepage-welcome-text"]');
      await expect(welcomeTextLocator).toHaveText(/Welcome to.*/);
    });

    await test.step('change language from English to Spanish', async () => {
      const welcomeTextLocator = page.locator('[data-qa-id="homepage-welcome-text"]');
      await api.post('/settings/Language', { value: 'es' });
      await page.reload();
      await expect(welcomeTextLocator).toHaveText(/Te damos la bienvenida a.*/);
    });
  });

  test('Change workspace language to browser language when no server language is provided', async ({ browser, api }) => {
    const context = await browser.newContext({
      locale: 'es-ES'
    });

    const page = await context.newPage();
    await page.goto('/home');
    const welcomeTextLocator = page.locator('[data-qa-id="homepage-welcome-text"]');
    await expect(welcomeTextLocator).toHaveText(/Welcome to.*/);
    
    await api.post('/settings/Language', { value: '' });
    await page.reload();
    await expect(welcomeTextLocator).toHaveText(/Te damos la bienvenida a.*/);
  });
});