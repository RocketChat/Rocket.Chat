/* eslint-disable @typescript-eslint/no-explicit-any */
import { Registration } from './page-objects';
import { setSettingValueById } from './utils/setSettingValueById';
import { test, expect } from './utils/test';

test.describe('OAuth', () => {
	let poRegistration: Registration;
	let pageCount = 0;

	test.beforeEach(async ({ page }) => {
		page.on('websocket', (ws) => {
			let isClosed = false;
			pageCount++;
			const pageId = pageCount;
			page.on('close', () => { isClosed = true; });

			console.log('DEBUGOAUTH', pageId, new Date().toISOString(), `WebSocket opened: ${ws.url()}>`);
			// ws.on('framesent', event => console.log('DEBUGOAUTH', pageId, new Date().toISOString(), 'WebSocket Frame Sent', event.payload));
			ws.on('framereceived', async event => {
				console.log('DEBUGOAUTH', pageId, new Date().toISOString(), 'WebSocket Frame Received', event.payload)
				if (event.payload.includes('loginServiceConfiguration')) {
					if (isClosed) {
						console.log('DEBUGOAUTH', pageId, new Date().toISOString(), 'page closed');
						return;
					}
					await page.waitForTimeout(500);

					if (isClosed) {
						console.log('DEBUGOAUTH', pageId, new Date().toISOString(), 'page closed');
						return;
					}
					await page.evaluate(() => {
						console.log('DEBUGOAUTH - calling debug func');
						if ((window as any).hudell_debug_func) {
							(window as any).hudell_debug_func();
						} else {
							console.log('DEBUGOAUTH - debug func not found');
						}
					});
				}
			});
			ws.on('close', () => console.log('DEBUGOAUTH', pageId, new Date().toISOString(), 'WebSocket closed'));
		});

		poRegistration = new Registration(page);

		await page.goto('/home');
	});

	test('Login Page', async ({ page, api }) => {
		await test.step('expect OAuth button to be visible', async () => {
			await expect((await setSettingValueById(api, 'Accounts_OAuth_Google', true)).status()).toBe(200);
			await page.waitForTimeout(3000);

			console.log('DEBUGOAUTH', new Date().toISOString(), 'expect to be visible');

			await expect(poRegistration.btnLoginWithGoogle).toBeVisible({ timeout: 10000 });
			await page.waitForTimeout(3000);
		});

		await test.step('expect OAuth button to not be visible', async () => {
			await expect((await setSettingValueById(api, 'Accounts_OAuth_Google', false)).status()).toBe(200);
			await page.waitForTimeout(3000);

			console.log('DEBUGOAUTH', new Date().toISOString(), 'expect to not be visible');
			await expect(poRegistration.btnLoginWithGoogle).not.toBeVisible({ timeout: 10000 });
			await page.waitForTimeout(3000);
		});
	});
});