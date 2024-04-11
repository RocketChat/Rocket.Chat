import { Users } from './fixtures/userStates';
import { setSettingValueById } from './utils/setSettingValueById';
import { setUserPreferences } from './utils/setUserPreferences';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe('Translations', () => {
    test.beforeAll(async ({ api }) => {
        expect((await setSettingValueById(api, 'Language', 'en')).status()).toBe(200);
        expect((await setSettingValueById(api, 'Site_Name', 'Rocket.Chat')).status()).toBe(200);
	});

    test.afterAll(async ({ api }) => {
        expect((await setUserPreferences(api, { language: '' })).status()).toBe(200);
        expect((await setSettingValueById(api, 'Language', 'en')).status()).toBe(200);
	});

    test.beforeEach(async ({ api }) => {
        expect((await setUserPreferences(api, { language: '' })).status()).toBe(200);
	})

    test('expect to respect user preference', async ({ page, api }) => {
        await page.goto('/home');
        await expect(page.locator('h2')).toHaveText('Welcome to Rocket.Chat');

        const response = page.waitForResponse('**/i18n/pt-BR.json');
        expect((await setUserPreferences(api, { language: 'pt-BR' })).status()).toBe(200);
        await response;
        await expect(page.locator('h2')).toHaveText('Bem-vindo ao Rocket.Chat');
    });

    test.describe('Browser language', () => {
        test.use({ locale: 'pt-BR' })
        test('expect to respect browser language', async ({ page }) => {
            await page.goto('/home');
            await expect(page.locator('h2')).toHaveText('Bem-vindo ao Rocket.Chat');
        });
    })
});
