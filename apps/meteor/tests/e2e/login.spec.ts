import { faker } from '@faker-js/faker';

import { Registration } from './page-objects';
import { test, expect } from './utils/test';

test.describe.parallel('Login', () => {
	let poRegistration: Registration;

	test.beforeEach(async ({ page }) => {
		poRegistration = new Registration(page);

		await page.goto('/home');
	});

	test('should not have any accessibility violations', async ({ makeAxeBuilder }) => {
		const results = await makeAxeBuilder().analyze();
		expect(results.violations).toEqual([]);
	})

	test('Login with invalid credentials', async () => {
		await test.step('expect to have username and password marked as invalid', async () => {
			await poRegistration.username.type(faker.internet.email());
			await poRegistration.inputPassword.type('any_password');
			await poRegistration.btnLogin.click();

			await expect(poRegistration.username).toBeInvalid();
			await expect(poRegistration.inputPassword).toBeInvalid();
		});
	});
});
