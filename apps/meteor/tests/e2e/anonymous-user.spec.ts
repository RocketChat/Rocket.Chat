import { faker } from '@faker-js/faker';

import { HomeChannel, Registration } from './page-objects';
import { setSettingValueById } from './utils/setSettingValueById';
import { expect, test } from './utils/test';

test.describe('anonymous-user', () => {
	let poHomeChannel: HomeChannel;

	test.beforeAll(async ({ api }) => {
		expect((await setSettingValueById(api, 'Accounts_AllowAnonymousRead', true)).status()).toBe(200);
		expect((await setSettingValueById(api, 'Accounts_AllowAnonymousWrite', true)).status()).toBe(200);
	});

	test.afterAll(async ({ api }) => {
		expect((await setSettingValueById(api, 'Accounts_AllowAnonymousRead', false)).status()).toBe(200);
		expect((await setSettingValueById(api, 'Accounts_AllowAnonymousWrite', false)).status()).toBe(200);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
		await poHomeChannel.sidenav.openChat('general');
	});

	test('expect to go to the login page as anonymous user', async ({ page }) => {
		await expect(poHomeChannel.content.btnAnonymousSignIn).toBeVisible({ timeout: 10000 });
		await poHomeChannel.content.btnAnonymousSignIn.click();

		await expect(page.locator('role=form')).toBeVisible();
	});

	test('expect to chat as anonymous user', async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		const poRegistration = new Registration(page);

		await expect(poHomeChannel.content.btnAnonymousTalk).toBeVisible({ timeout: 10000 });
		await poHomeChannel.content.btnAnonymousTalk.click();

		await expect(poRegistration.username).toBeVisible();
		await poRegistration.username.type(faker.internet.userName());

		await expect(poRegistration.btnRegisterConfirmUsername).toBeVisible();
		await poRegistration.btnRegisterConfirmUsername.click();

		await poHomeChannel.content.sendMessage('hello world');
	});
});
