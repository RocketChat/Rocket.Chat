import { faker } from '@faker-js/faker';

import { HomeChannel, Registration } from './page-objects';
import { expect, test } from './utils/test';

test.describe('anonymous-user', () => {
	let poHomeChannel: HomeChannel;

	test.beforeAll(async ({ updateSetting }) => {
		await Promise.all([
			updateSetting('Accounts_AllowAnonymousRead', true, false),
			updateSetting('Accounts_AllowAnonymousWrite', true, false),
		]);
	});

	test.afterAll(async ({ restoreSettings }) => {
		await restoreSettings();
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
