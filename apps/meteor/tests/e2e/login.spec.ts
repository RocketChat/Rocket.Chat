import { faker } from '@faker-js/faker';

import { DEFAULT_USER_CREDENTIALS } from './config/constants';
import { Registration, Authenticated } from './page-objects';
import { setSettingValueById } from './utils/setSettingValueById';
import { test, expect } from './utils/test';

test.describe.parallel('Login', () => {
	let poRegistration: Registration;
	let poAuth: Authenticated;

	test.beforeEach(async ({ page }) => {
		poRegistration = new Registration(page);
		poAuth = new Authenticated(page);

		await page.goto('/home');
	});

	test.afterAll(async ({ api }) => {
		await setSettingValueById(api, 'Language', 'en');
	});

	test('should not have any accessibility violations', async ({ makeAxeBuilder }) => {
		const results = await makeAxeBuilder().analyze();
		expect(results.violations).toEqual([]);
	});

	test('Login with invalid credentials', async () => {
		await test.step('expect to have username and password marked as invalid', async () => {
			await poRegistration.username.type(faker.internet.email());
			await poRegistration.inputPassword.type('any_password');
			await poRegistration.btnLogin.click();

			await expect(poRegistration.username).toBeInvalid();
			await expect(poRegistration.inputPassword).toBeInvalid();
		});
	});

	test('Login with valid username and password', async () => {
		await test.step('expect successful login', async () => {
			await poRegistration.username.type('user1');
			await poRegistration.inputPassword.type(DEFAULT_USER_CREDENTIALS.password);
			await poRegistration.btnLogin.click();

			await poAuth.waitForDisplay();
		});
	});

	test('Login with valid email and password', async () => {
		await test.step('expect successful login', async () => {
			await poRegistration.username.type('user1@email.com');
			await poRegistration.inputPassword.type(DEFAULT_USER_CREDENTIALS.password);
			await poRegistration.btnLogin.click();

			await poAuth.waitForDisplay();
		});
	});

	test('Should correctly display switch language button', async ({ page, api }) => {
		expect((await setSettingValueById(api, 'Language', 'pt-BR')).status()).toBe(200);

		const buttonDefault = page.getByRole('button', { name: 'Change to Default' });
		await expect(buttonDefault).not.toBeVisible();

		const button = page.getByRole('button', { name: 'Alterar para português (Brasil)' });
		await button.click();

		await expect(page.getByRole('button', { name: 'Fazer Login' })).toBeVisible();

		const buttonEnglish = page.getByRole('button', { name: 'Change to English' });
		await buttonEnglish.click();

		await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
	});
});
