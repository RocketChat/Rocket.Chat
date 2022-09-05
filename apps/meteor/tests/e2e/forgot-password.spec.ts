import type { Locator } from '@playwright/test';

import { test, expect } from './utils/test';
import { Registration } from './page-objects';

expect.extend({
	async toBeInvalid(received: Locator) {
		const pass = await received.evaluate((node) => node.getAttribute('aria-invalid') === 'true');

		return {
			message: () => `expected ${received} to be invalid`,
			pass,
		};
	},
	async hasAttribute(received: Locator, attribute: string) {
		const pass = await received.evaluate((node, attribute) => node.hasAttribute(attribute), attribute);

		return {
			message: () => `expected ${received} to have attribute \`${attribute}\``,
			pass,
		};
	},
});

test.describe.parallel('Forgot Password', () => {
	let poRegistration: Registration;

	test.beforeEach(async ({ page }) => {
		poRegistration = new Registration(page);

		await page.goto('/home');
		await poRegistration.btnForgotPassword.click();
	});

	test('Email validation', async () => {
		await test.step('expect trigger a validation error if no email is provided', async () => {
			await poRegistration.btnSubmit.click();
			await expect(poRegistration.inputEmail).toBeInvalid();
		});

		await test.step('expect trigger a validation if a invalid email is provided (1)', async () => {
			await poRegistration.inputEmail.fill('mail@mail');
			await poRegistration.btnSubmit.click();

			await expect(poRegistration.inputEmail).toBeInvalid();
		});

		await test.step('expect trigger a validation if a invalid email is provided (2)', async () => {
			await poRegistration.inputEmail.fill('mail');
			await poRegistration.btnSubmit.click();

			await expect(poRegistration.inputEmail).toBeInvalid();
		});

		await test.step('expect to show a success toast if a valid email is provided', async () => {
			await poRegistration.inputEmail.fill('mail@mail.com');
			await poRegistration.btnSubmit.click();

			await expect(poRegistration.forgotPasswordEmailCallout).toBeVisible();
		});
	});
});
