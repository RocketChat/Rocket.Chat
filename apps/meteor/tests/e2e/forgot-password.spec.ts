import { test, expect } from './utils/test';
import { Registration } from './page-objects';

test.describe.parallel('Forgot Password', () => {
	let poRegistration: Registration;

	test.beforeEach(async ({ page }) => {
		poRegistration = new Registration(page);

		await page.goto('/home');
		await poRegistration.btnForgotPassword.click();
	});

	test('Email validation', async () => {
		await test.step('expect trigger a validation error if no email is provided', async () => {
			await poRegistration.btnSendInstructions.click();
			await expect(poRegistration.inputEmail).toBeInvalid();
		});

		await test.step('expect trigger a validation if a invalid email is provided (1)', async () => {
			await poRegistration.inputEmail.fill('mail@mail');
			await poRegistration.btnSendInstructions.click();

			await expect(poRegistration.inputEmail).toBeInvalid();
		});

		await test.step('expect trigger a validation if a invalid email is provided (2)', async () => {
			await poRegistration.inputEmail.fill('mail');
			await poRegistration.btnSendInstructions.click();

			await expect(poRegistration.inputEmail).toBeInvalid();
		});

		await test.step('expect to show a success toast if a valid email is provided', async () => {
			await poRegistration.inputEmail.fill('mail@mail.com');
			await poRegistration.btnSendInstructions.click();

			await expect(poRegistration.forgotPasswordEmailCallout).toBeVisible();
		});
	});
});
