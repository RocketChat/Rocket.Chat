import { faker } from '@faker-js/faker';

import { HomeChannel } from './page-objects';
import { setSettingValueById } from './utils/setSettingValueById';
import { expect, test } from './utils/test';

test.describe('anonymous-user', () => {
	let poHomeChannel: HomeChannel;

	test.beforeAll(async ({ api }) => {
		expect((await setSettingValueById(api, 'Accounts_AllowAnonymousRead', true)).status()).toBe(200);
		expect((await setSettingValueById(api, 'Accounts_AllowAnonymousWrite', true)).status()).toBe(200);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
		await page.waitForSelector('[data-qa="page-home"]');
		await poHomeChannel.sidenav.openChat('general');
	});

	test('expect to go to the login page as anonymous user', async ({ page }) => {
		const SIGN_IN_BUTTON = page.locator('[data-qa-id="composer-anonymous-sign-in-button"]');

		await expect(SIGN_IN_BUTTON).toBeVisible({ timeout: 10000 });
		await SIGN_IN_BUTTON.click();

		await expect(page.locator('[data-qa-id="login-form"]')).toBeVisible();
	});

	test('expect to chat as anonymous user', async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		const TALK_ANONYMOUS_BUTTON = page.locator('[data-qa-id="composer-anonymous-talk-button"]');

		await expect(TALK_ANONYMOUS_BUTTON).toBeVisible({ timeout: 10000 });
		await TALK_ANONYMOUS_BUTTON.click();

		await expect(page.locator('[data-qa="username-form"]')).toBeVisible();

		await expect(page.locator('[data-qa-id="username-input"]')).toBeVisible();
		await page.locator('[data-qa-id="username-input"]').fill(faker.internet.userName());

		await expect(page.locator('[data-qa-id="username-submit"]')).toBeVisible();
		await page.locator('[data-qa-id="username-submit"]').click();

		await expect(page.locator('[data-qa-id="message-composer-input"]')).toBeVisible();
		await page.locator('[data-qa-id="message-composer-input"]').fill('Hello World!');
		await page.locator('[data-qa-id="message-composer-send"]').click();
	});
});
