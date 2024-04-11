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

    test.beforeEach(async ({ api, page }) => {
        expect((await setUserPreferences(api, { language: '' })).status()).toBe(200);
        await page.goto('/home');
	})

    test('expect to respect user preference', async ({ page, api }) => {
        await expect(page.locator('h2')).toHaveText('Welcome to Rocket.Chat');

        expect((await setUserPreferences(api, { language: 'pt-BR' })).status()).toBe(200);

        await expect(page.locator('h2')).toHaveText('Bem-vindo ao Rocket.Chat');
    });

    test.describe('Browser language', () => {
        test.use({ locale: 'pt-BR' })
        test('expect to respect browser language', async ({ page }) => {
            // await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
            await expect(page.locator('h2')).toHaveText('Bem-vindo ao Rocket.Chat');
        });
    })

    test.describe.skip('Server language', () => {
        test.use({ locale: '' })
        test('expect to respect server language', async ({ page, api }) => {
            // Didn't find a way to force the client to use the server language
            await expect(page.locator('h2')).toHaveText('Welcome to Rocket.Chat');

            expect((await setSettingValueById(api, 'Language', 'pt-BR')).status()).toBe(200);

            await expect(page.locator('h2')).toHaveText('Bem-vindo ao Rocket.Chat');
        });
    })
});
