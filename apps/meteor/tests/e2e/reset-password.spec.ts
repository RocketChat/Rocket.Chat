import { Registration } from './page-objects';
import { setSettingValueById } from './utils/setSettingValueById';
import { test, expect } from './utils/test';

test.describe.parallel('Reset Password', () => {
	let poRegistration: Registration;

	test.beforeEach(async ({ api, page }) => {
		poRegistration = new Registration(page);
		await setSettingValueById(api, 'Accounts_RequirePasswordConfirmation', true);

		await page.goto('/reset-password/someToken');
	});

	test.afterAll(async ({ api }) => {
		await setSettingValueById(api, 'Accounts_RequirePasswordConfirmation', true);
	});

	test('should confirm password be invalid', async () => {
		await poRegistration.inputPassword.fill('123456');
		await poRegistration.inputPasswordConfirm.fill('123455');
		await poRegistration.btnReset.click();
		await expect(poRegistration.inputPasswordConfirm).toBeInvalid();
	});

	test('should confirm password not be visible', async ({ api }) => {
		await setSettingValueById(api, 'Accounts_RequirePasswordConfirmation', false);
		await expect(poRegistration.inputPasswordConfirm).not.toBeVisible();
	});

	test('should not have any accessibility violations', async ({ makeAxeBuilder }) => {
		const results = await makeAxeBuilder().analyze();
		expect(results.violations).toEqual([]);
	});
});
