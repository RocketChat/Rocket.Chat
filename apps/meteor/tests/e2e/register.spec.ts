import { faker } from '@faker-js/faker';

import { test, expect } from './utils/test';
import { Registration } from './page-objects';

test.describe.serial('register', () => {
	let poRegistration: Registration;

	test.describe('Registration default flow', async () => {
		test.beforeEach(async ({ page }) => {
			poRegistration = new Registration(page);
		});
		test('Successfully Registration flow', async ({ page }) => {
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
				await poRegistration.inputName.fill(faker.name.firstName());
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
				await expect(poRegistration.main).toBeHidden();
			});
		});

		test.describe('Registration without Account confirmation password set', async () => {
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

			test('expect to register a user without password confirmation', async () => {
				await test.step('expect to not have password confirmation field', async () => {
					await expect(poRegistration.inputPasswordConfirm).toBeHidden();
				});

				await test.step('expect to found no errors after submit the form', async () => {
					await poRegistration.inputName.fill(faker.name.firstName());
					await poRegistration.inputEmail.fill(faker.internet.email());
					await poRegistration.username.fill(faker.internet.userName());
					await poRegistration.inputPassword.fill('any_password');

					await poRegistration.btnRegister.click();
					await expect(poRegistration.main).toBeHidden();
				});
			});
		});

		test.describe('Registration with manually confirmation enabled', async () => {
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

			test('it should expect to have a textbox asking the reason for the registration', async () => {
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

			test('It should expect a message warning that registration is disabled', async ({ page }) => {
				await page.goto('/home');
				await poRegistration.goToRegister.click();
				await expect(poRegistration.registrationDisabledCallout).toBeVisible();
			});
		});
	});

	test.describe('Registration for secret password', async () => {
		test.beforeEach(async ({ api, page }) => {
			poRegistration = new Registration(page);
			const result = await api.post('/settings/Accounts_RegistrationForm', { value: 'Secret URL' });
			await api.post('/settings/Accounts_RegistrationForm_SecretURL', { value: 'secret' });
			await expect(result.ok()).toBeTruthy();
		});

		test.afterAll(async ({ api }) => {
			const result = await api.post('/settings/Accounts_RegistrationForm', { value: 'Public' });
			await expect(result.ok()).toBeTruthy();
		});

		test('It should expect a message warning that registration is disabled', async ({ page }) => {
			await page.goto('/home');
			await poRegistration.goToRegister.click();
			await expect(poRegistration.registrationDisabledCallout).toBeVisible();
		});

		test.describe('Using an invalid secret password', async () => {
			test.beforeEach(async ({ page }) => {
				await page.goto('/register/invalid_secret');
			});
			test('It should expect a invalid page informing that the secret password is invalid', async ({ page }) => {
				await expect(page.locator('role=heading[level=2][name="The URL provided is invalid."]')).toBeVisible({
					timeout: 10000,
				});
			});
		});

		test('It should register a user if the right secret password is provided', async ({ page }) => {
			await page.goto('/register/secret');
			await page.waitForSelector('role=form');
			await poRegistration.inputName.fill(faker.name.firstName());
			await poRegistration.inputEmail.fill(faker.internet.email());
			await poRegistration.username.fill(faker.internet.userName());
			await poRegistration.inputPassword.fill('any_password');
			await poRegistration.inputPasswordConfirm.fill('any_password');
			await poRegistration.btnRegister.click();
			await page.waitForSelector('role=main');
			await expect(poRegistration.main).toBeVisible();
		});
	});

	test.describe('Registration by Secret is disabled url should fail', async () => {
		test.beforeAll(async ({ api }) => {
			const result = await api.post('/settings/Accounts_RegistrationForm', { value: 'Public' });
			await api.post('/settings/Accounts_RegistrationForm_SecretURL', { value: 'secret' });
			await expect(result.ok()).toBeTruthy();
		});

		test('It should show an invalid page informing that the url is not valid', async ({ page }) => {
			await page.goto('/register/secret');
			await page.waitForSelector('role=heading[level=2]');
			await expect(page.locator('role=heading[level=2][name="The URL provided is invalid."]')).toBeVisible();
		});
	});
});
