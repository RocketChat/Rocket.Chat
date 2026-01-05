import { faker } from '@faker-js/faker';

import { AccountPreferences, Authenticated, Registration } from './page-objects';
import { request } from '../data/api-data';
import { test, expect } from './utils/test';

test.describe.parallel('register', () => {
	let poRegistration: Registration;
	let poAuth: Authenticated;

	test.beforeEach(({ page, t }) => {
		poRegistration = new Registration(page, t);
		poAuth = new Authenticated(page, t);
	});

	test.describe('Registration default flow', async () => {
		test('should complete the registration flow', async ({ page }) => {
			await test.step('expect trigger a validation error if no data is provided on register', async () => {
				await page.goto('/home');
				await poRegistration.goToRegister.click();

				await poRegistration.btnRegister.click();

				await expect(poRegistration.inputName).toBeInvalid();
				await expect(poRegistration.inputEmail).toBeInvalid();
				await expect(poRegistration.inputPassword).toBeInvalid();
				await expect(poRegistration.username).toBeInvalid();
			});

			await test.step('expect trigger a validation error if different password is provided on register', async () => {
				await poRegistration.inputName.fill(faker.person.firstName());
				await poRegistration.inputEmail.fill(faker.internet.email());
				await poRegistration.username.fill(faker.internet.userName());
				await poRegistration.inputPassword.fill('any_password');
				await poRegistration.inputPasswordConfirm.fill('any_password_2');
				await poRegistration.btnRegister.click();

				await expect(poRegistration.inputPasswordConfirm).toBeInvalid();
			});

			await test.step('expect successfully register a new user', async () => {
				await poRegistration.inputPasswordConfirm.fill('any_password');
				await poRegistration.btnRegister.click();
				await poAuth.waitForDisplay();
			});
		});

		test.describe('should complete registration without account confirmation password set', async () => {
			test.beforeEach(async ({ api }) => {
				const result = await api.post('/settings/Accounts_RequirePasswordConfirmation', { value: false });

				await expect(result.ok()).toBeTruthy();
			});

			test.beforeEach(async ({ page }) => {
				await page.goto('/home');
				await poRegistration.goToRegister.click();
			});

			test.afterEach(async ({ api }) => {
				const result = await api.post('/settings/Accounts_RequirePasswordConfirmation', {
					value: true,
				});

				await expect(result.ok()).toBeTruthy();
			});

			test('should register a user without password confirmation', async () => {
				await test.step('expect to not have password confirmation field', async () => {
					await expect(poRegistration.inputPasswordConfirm).toBeHidden();
				});

				await test.step('expect to found no errors after submit the form', async () => {
					await poRegistration.inputName.fill(faker.person.firstName());
					await poRegistration.inputEmail.fill(faker.internet.email());
					await poRegistration.username.fill(faker.internet.userName());
					await poRegistration.inputPassword.fill('any_password');

					await poRegistration.btnRegister.click();
					await poAuth.waitForDisplay();
				});
			});
		});

		test.describe('should complete registration with manually confirmation enabled', async () => {
			test.beforeEach(async ({ api }) => {
				const result = await api.post('/settings/Accounts_ManuallyApproveNewUsers', { value: true });

				await expect(result.ok()).toBeTruthy();
			});

			test.beforeEach(async ({ page }) => {
				poRegistration = new Registration(page);

				await page.goto('/home');
				await poRegistration.goToRegister.click();
			});

			test.afterEach(async ({ api }) => {
				const result = await api.post('/settings/Accounts_ManuallyApproveNewUsers', {
					value: false,
				});
				await expect(result.ok()).toBeTruthy();
			});

			test('should expect to have a textbox asking the reason for the registration', async () => {
				await test.step('expect to have a textbox asking the reason for the registration', async () => {
					await expect(poRegistration.inputReason).toBeVisible();
				});

				await test.step('expect to show and error if no reason is provided', async () => {
					await poRegistration.btnRegister.click();
					await expect(poRegistration.inputReason).toBeInvalid();
				});
			});
		});

		test.describe('Registration form Disabled', async () => {
			test.beforeEach(async ({ api }) => {
				const result = await api.post('/settings/Accounts_RegistrationForm', { value: 'Disabled' });
				await expect(result.ok()).toBeTruthy();
			});

			test.afterEach(async ({ api }) => {
				await api.post('/settings/Accounts_RegistrationForm', { value: 'Public' });
			});

			test('should expect a message warning that registration is disabled', async ({ page }) => {
				await page.goto('/home');
				await poRegistration.goToRegister.click();
				await expect(poRegistration.registrationDisabledCallout).toBeVisible();
			});
		});

		test('should not have any accessibility violations', async ({ page, makeAxeBuilder }) => {
			await page.goto('/home');
			await poRegistration.goToRegister.click();

			const results = await makeAxeBuilder().analyze();

			expect(results.violations).toEqual([]);
		});
	});

	test.describe('Registration form validation', async () => {
		test('should not allow registration with an already registered email', async ({ page }) => {
			const email = faker.internet.email();
			await request.post('/api/v1/users.register').set('Content-Type', 'application/json').send({
				name: faker.person.firstName(),
				email,
				username: faker.internet.userName(),
				pass: 'any_password',
			});

			await test.step('Attempt registration with the same email', async () => {
				await page.goto('/home');
				await poRegistration.goToRegister.click();
				await poRegistration.inputName.fill(faker.person.firstName());
				await poRegistration.inputEmail.fill(email);
				await poRegistration.username.fill(faker.internet.userName());
				await poRegistration.inputPassword.fill('any_password');
				await poRegistration.inputPasswordConfirm.fill('any_password');
				await poRegistration.btnRegister.click();

				await expect(page.getByRole('alert').filter({ hasText: 'Email already exists' })).toBeVisible();
			});
		});
	});

	test.describe('Registration for secret password', async () => {
		test.beforeEach(async ({ api }) => {
			const result = await api.post('/settings/Accounts_RegistrationForm', { value: 'Secret URL' });
			await api.post('/settings/Accounts_RegistrationForm_SecretURL', { value: 'secret' });
			await expect(result.ok()).toBeTruthy();
		});

		test.afterAll(async ({ api }) => {
			const result = await api.post('/settings/Accounts_RegistrationForm', { value: 'Public' });
			await expect(result.ok()).toBeTruthy();
		});

		test('should expect a message warning that registration is disabled', async ({ page }) => {
			await page.goto('/home');
			await poRegistration.goToRegister.click();
			await expect(poRegistration.registrationDisabledCallout).toBeVisible();
		});

		test.describe('Using an invalid secret password', async () => {
			test.beforeEach(async ({ page }) => {
				await page.goto('/register/invalid_secret');
			});

			test('should expect a invalid page informing that the secret password is invalid', async ({ page }) => {
				await expect(page.locator('role=heading[level=2][name="The URL provided is invalid."]')).toBeVisible({
					timeout: 10000,
				});
			});
		});

		test('should register a user if the right secret password is provided', async ({ page }) => {
			await page.goto('/register/secret');
			await page.waitForSelector('role=form');
			await poRegistration.inputName.fill(faker.person.firstName());
			await poRegistration.inputEmail.fill(faker.internet.email());
			await poRegistration.username.fill(faker.internet.userName());
			await poRegistration.inputPassword.fill('any_password');
			await poRegistration.inputPasswordConfirm.fill('any_password');
			await poRegistration.btnRegister.click();
			await poAuth.waitForDisplay();
		});
	});

	test.describe('Registration by Secret is disabled url should fail', async () => {
		test.beforeAll(async ({ api }) => {
			const result = await api.post('/settings/Accounts_RegistrationForm', { value: 'Public' });
			await api.post('/settings/Accounts_RegistrationForm_SecretURL', { value: 'secret' });
			await expect(result.ok()).toBeTruthy();
		});

		test('should show an invalid page informing that the url is not valid', async ({ page }) => {
			await page.goto('/register/secret');
			await page.waitForSelector('role=heading[level=2]');
			await expect(page.locator('role=heading[level=2][name="The URL provided is invalid."]')).toBeVisible();
		});
	});

	test.describe('Language preference persistence', () => {
		test.use({ locale: 'pt-BR' });

		test('should keep Portuguese selection in account preferences after registration', async ({ page, t }) => {
			const poAccountPreferences = new AccountPreferences(page, t);
			const name = faker.person.firstName();
			const username = faker.string.alphanumeric({ length: 10 }).toLowerCase();
			const email = `${username}@example.com`;
			const password = `Passw0rd!${faker.number.int({ min: 1000, max: 9999 })}`;

			await test.step('prepare registration page in English', async () => {
				await page.goto('/home');
				await poRegistration.goToRegister.click();
				await expect(poRegistration.inputName).toBeVisible();
				await page.getByRole('button', { name: 'Change to English' }).click();
				await page.getByRole('button', { name: 'Alterar para português (Brasil)' }).click();
			});

			await test.step('complete registration with Portuguese selected', async () => {
				await poRegistration.inputName.fill(name);
				await poRegistration.inputEmail.fill(email);
				await poRegistration.username.fill(username);
				await poRegistration.inputPassword.fill(password);
				await poRegistration.inputPasswordConfirm.fill(password);
				await poRegistration.btnRegister.click();
				await poAuth.waitForDisplay();
			});

			await test.step('verify Portuguese is selected in account preferences', async () => {
				await page.goto('/account/preferences');
				await expect(poAccountPreferences.languageSelect).toBeVisible();
				await expect(poAccountPreferences.hiddenLanguageSelect).toHaveValue('pt-BR');
				await poAccountPreferences.languageSelect.click();
				await page.keyboard.press('Escape');
			});
		});
	});
});
