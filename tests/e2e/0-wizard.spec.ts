import { test, expect } from '@playwright/test';

import SetupWizzard from './utils/pageobjects/wizzard.page';
import { adminUsername, adminEmail, adminPassword } from './utils/mocks/userAndPasswordMock';

const executeFunction = (): void => {
	test.describe('[Wizzard]', () => {
		let setupWizard: SetupWizzard;

		test.beforeAll(async ({ browser, baseURL }) => {
			setupWizard = new SetupWizzard(browser, baseURL);
			await setupWizard.open('');
		});

		test.describe('[Step 1]', () => {
			test('expect required field alert showed when user dont inform data', async () => {
				await setupWizard.goNext();

				await expect(setupWizard.fullNameIvalidtext()).toBeVisible();
				await expect(setupWizard.userNameInvalidText()).toBeVisible();
				await expect(setupWizard.companyEmailInvalidText()).toBeVisible();
				await expect(setupWizard.passwordInvalidText()).toBeVisible();
			});
		});

		test('expect alert showed when email provided is invalid', async () => {
			await setupWizard.fullName().type('Any admin Name');
			await setupWizard.userName().type(adminUsername);
			await setupWizard.companyEmail().type('useremail');
			await setupWizard.password().type(adminPassword);

			await setupWizard.goNext();

			await expect(setupWizard.companyEmailInvalidText()).toBeVisible();
		});
	});
};

export default executeFunction;
