import { Registration } from './page-objects';
import { test, expect } from './utils/test';

test.describe.parallel('Reset Password', () => {
	let poRegistration: Registration;

	test.beforeEach(async ({ updateSetting, page }) => {
		poRegistration = new Registration(page);
		await updateSetting('Accounts_RequirePasswordConfirmation', true, true);

		await page.goto('/reset-password/someToken');
	});

	test.afterAll(async ({ restoreSettings }) => {
		await restoreSettings();
	});

	test('should confirm password be invalid', async () => {
		await poRegistration.inputPassword.fill('123456');
		await poRegistration.inputPasswordConfirm.fill('123455');
		await poRegistration.btnReset.click();
		await expect(poRegistration.inputPasswordConfirm).toBeInvalid();
	});

	test('should confirm password not be visible', async ({ updateSetting }) => {
		await updateSetting('Accounts_RequirePasswordConfirmation', false, true);
		await expect(poRegistration.inputPasswordConfirm).not.toBeVisible();
	});

	test('should not have any accessibility violations', async ({ makeAxeBuilder }) => {
		const results = await makeAxeBuilder().analyze();
		expect(results.violations).toEqual([]);
	});
});
