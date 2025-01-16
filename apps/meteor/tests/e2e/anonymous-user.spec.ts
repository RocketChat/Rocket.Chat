import { faker } from '@faker-js/faker';

import { HomeChannel, Registration } from './page-objects';
import { setSettingValueById } from './utils/setSettingValueById';
import { expect, test } from './utils/test';

// Bypassing this one for now because of a bug with anonymous permissions check
// TODO: fix the permissions for anonymous users
test.describe.skip('anonymous-user', () => {
	let poHomeChannel: HomeChannel;

	test.beforeAll(async ({ api }) => {
		await expect((await setSettingValueById(api, 'Accounts_AllowAnonymousRead', true)).status()).toBe(200);
		await expect((await setSettingValueById(api, 'Accounts_AllowAnonymousWrite', true)).status()).toBe(200);
	});

	test.afterAll(async ({ api }) => {
		await expect((await setSettingValueById(api, 'Accounts_AllowAnonymousRead', false)).status()).toBe(200);
		await expect((await setSettingValueById(api, 'Accounts_AllowAnonymousWrite', false)).status()).toBe(200);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
		await poHomeChannel.sidenav.openChat('general');
	});

	test('expect to go to the login page as anonymous user', async ({ page }) => {
		await poHomeChannel.content.btnAnonymousSignIn.click();

		await expect(page.locator('role=form')).toBeVisible();
	});

	test('expect to chat as anonymous user', async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		const poRegistration = new Registration(page);

		await poHomeChannel.content.btnAnonymousTalk.click();

		await expect(poRegistration.username).toBeVisible();
		await poRegistration.username.type(faker.internet.userName());

		await poRegistration.btnRegisterConfirmUsername.click();

		await poHomeChannel.content.sendMessage('hello world');
	});
});
