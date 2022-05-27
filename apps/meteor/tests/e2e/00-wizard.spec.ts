import { test, expect, Page } from '@playwright/test';

import { VALID_EMAIL, adminLogin } from './utils/mocks/userAndPasswordMock';
import { setupWizardStepRegex } from './utils/mocks/urlMock';
import { HOME_SELECTOR } from './utils/mocks/waitSelectorsMock';
import { Login, SetupWizard } from './page-objects';

test.describe('[Wizard]', () => {
	let setupWizard: SetupWizard;
	let login: Login;
	let page: Page;

	test.beforeEach(async ({ browser }) => {
		const context = await browser.newContext();

		page = await context.newPage();
		setupWizard = new SetupWizard(page);
		login = new Login(page);
	});

	test.describe('[Step 2]', async () => {
		test.beforeEach(async () => {
			await page.goto('/');
			await login.doLogin(adminLogin);
		});

		test('expect required field alert showed when user dont inform data', async () => {
			await setupWizard.stepTwoFailedWithBlankFields();
		});

		test('expect go to Step 3 successfully', async () => {
			await setupWizard.stepTwoSuccess();
			await expect(page).toHaveURL(setupWizardStepRegex._3);
		});
	});

	test.describe('[Step 3]', async () => {
		test.beforeEach(async () => {
			await page.goto('');
			await login.doLogin(adminLogin);
			await setupWizard.stepTwoSuccess();
		});

		test('expect have email field to register the server', async () => {
			await expect(setupWizard.inputRegisteredServer).toBeVisible();
		});

		test('expect start "Register" button disabled', async () => {
			await expect(setupWizard.btnRegister).toBeDisabled();
		});

		test('expect show an error on invalid email', async () => {
			await setupWizard.stepThreeFailedWithInvalidField();
		});

		test('expect enable "Register" button when email is valid and terms checked', async () => {
			await setupWizard.inputRegisteredServer.type(VALID_EMAIL);
			await setupWizard.checkboxAgreement.click();
			await expect(setupWizard.btnRegister).toBeEnabled();
		});

		test('expect have option for standalone server', async () => {
			await expect(setupWizard.standaloneServer).toBeVisible();
		});
	});

	test.describe('[Final Step]', async () => {
		test.beforeEach(async () => {
			await page.goto('');
			await login.doLogin(adminLogin);
			await setupWizard.stepTwoSuccess();
			await setupWizard.stepThreeSuccess();
		});

		test('expect confirm the standalone option', async () => {
			await expect(setupWizard.btnConfirm).toBeVisible();
			await expect(setupWizard.textStandaloneConfirm).toBeVisible();
		});

		test('expect confirm standalone', async () => {
			await setupWizard.btnConfirm.click();
			await page.waitForSelector(HOME_SELECTOR);
		});
	});
});
