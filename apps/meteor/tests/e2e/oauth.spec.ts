import { Registration } from './page-objects';
import { setSettingValueById } from './utils/setSettingValueById';
import { test, expect } from './utils/test';

test.describe('OAuth', () => {
	let poRegistration: Registration;

	test.beforeEach(async ({ page }) => {
		page.on('websocket', (ws) => {
			console.log('DEBUGOAUTH', new Date().toISOString(), `WebSocket opened: ${ws.url()}>`);
			// ws.on('framesent', event => console.log('DEBUGOAUTH', new Date().toISOString(), 'WebSocket Frame Sent', event.payload));
			ws.on('framereceived', event => console.log('DEBUGOAUTH', new Date().toISOString(), 'WebSocket Frame Received', event.payload));
			ws.on('close', () => console.log('DEBUGOAUTH', new Date().toISOString(), 'WebSocket closed'));
		});

		poRegistration = new Registration(page);

		await page.goto('/home');
	});

	test('Login Page', async ({ api }) => {
		await test.step('expect OAuth button to be visible', async () => {
			await expect((await setSettingValueById(api, 'Accounts_OAuth_Google', true)).status()).toBe(200);
			console.log('DEBUGOAUTH', new Date().toISOString(), 'expect to be visible');

			await expect(poRegistration.btnLoginWithGoogle).toBeVisible({ timeout: 10000 });
		});

		await test.step('expect OAuth button to not be visible', async () => {
			await expect((await setSettingValueById(api, 'Accounts_OAuth_Google', false)).status()).toBe(200);

			console.log('DEBUGOAUTH', new Date().toISOString(), 'expect to not be visible');
			await expect(poRegistration.btnLoginWithGoogle).not.toBeVisible({ timeout: 10000 });
		});
	});
});