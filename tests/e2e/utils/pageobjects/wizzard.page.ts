import { Locator } from '@playwright/test';

import Pages from './Pages';
import LoginPage from './login.page';
import { adminEmail, adminPassword } from '../mocks/userAndPasswordMock';

class SetupWizard extends Pages {
	private nextStep(): Locator {
		return this.page.locator('//button[contains(text(), "Next")]');
	}

	public fullName(): Locator {
		return this.page.locator('[name="fullname"]');
	}

	public userName(): Locator {
		return this.page.locator('[name="username"]');
	}

	public companyEmail(): Locator {
		return this.page.locator('[name="companyEmail"]');
	}

	public password(): Locator {
		return this.page.locator('[name="password"]');
	}

	public goToWorkspace(): Locator {
		return this.page.locator('//button[contains(text(), "Confirm")]');
	}

	public organizationType(): Locator {
		return this.page.locator('[name="organizationType"]');
	}

	public organizationName(): Locator {
		return this.page.locator('[name="organizationName"]');
	}

	public industry(): Locator {
		return this.page.locator('[name="organizationIndustry"]');
	}

	public size(): Locator {
		return this.page.locator('[name="organizationSize"]');
	}

	public country(): Locator {
		return this.page.locator('[name="country"]');
	}

	public registeredServer(): Locator {
		return this.page.locator('input[name=email]');
	}

	public registerButton(): Locator {
		return this.page.locator('button:contains("Register")');
	}

	// public agreementField(): Locator {
	// 	return this.page.locator('input[name=agreement]').closest('.rcx-check-box');
	// }

	public standaloneServer(): Locator {
		return this.page.locator('button:contains("Continue as standalone")');
	}

	public standaloneConfirmText(): Locator {
		return this.page.locator('.rcx-box:contains("Standalone Server Confirmation")');
	}

	public fullNameIvalidtext(): Locator {
		return this.page.locator('//input[@name="fullname"]/../following-sibling::span');
	}

	public userNameInvalidText(): Locator {
		return this.page.locator('//input[@name="username"]/../following-sibling::span');
	}

	public companyEmailInvalidText(): Locator {
		return this.page.locator('//input[@name="companyEmail"]/../following-sibling::span');
	}

	public passwordInvalidText(): Locator {
		return this.page.locator('//input[@name="password"]/../../../span[contains(@class, "rcx-field__error")]');
	}

	public async login(): Promise<void> {
		const loginObj = new LoginPage(this.browser, this.baseURL);
		await loginObj.login({ email: adminEmail, password: adminPassword });
	}

	public async goNext(): Promise<void> {
		await this.nextStep().click();
	}

	// goToHome() {
	// 	this.goToWorkspace.click();
	// }
}

export default SetupWizard;
