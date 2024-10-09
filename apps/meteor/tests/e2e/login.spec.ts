import { faker } from '@faker-js/faker';

import { DEFAULT_USER_CREDENTIALS } from './config/constants';
import { Utils, Registration } from './page-objects';
import { test, expect } from './utils/test';

test.describe.parallel('Login', () => {
	let poRegistration: Registration;
	let poUtils: Utils;

	test.beforeEach(async ({ page }) => {
		poRegistration = new Registration(page);
		poUtils = new Utils(page);

		await page.goto('/home');
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

			await expect(poUtils.mainContent).toBeVisible();
		});
	});

	test('Login with valid email and password', async () => {
		await test.step('expect successful login', async () => {
			await poRegistration.username.type('user1@email.com');
			await poRegistration.inputPassword.type(DEFAULT_USER_CREDENTIALS.password);
			await poRegistration.btnLogin.click();

			await expect(poUtils.mainContent).toBeVisible();
		});
	});
});
