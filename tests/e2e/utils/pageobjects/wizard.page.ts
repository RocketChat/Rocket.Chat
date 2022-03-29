import { expect, Locator } from '@playwright/test';

import Pages from './Pages';
import LoginPage from './login.page';
import { adminUsername, adminEmail, adminPassword, reason } from '../mocks/userAndPasswordMock';

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

	public organizationTypeSelect(): Locator {
		return this.page.locator('.rcx-options .rcx-option:first-child');
	}

	public organizationName(): Locator {
		return this.page.locator('[name="organizationName"]');
	}

	public industry(): Locator {
		return this.page.locator('[name="organizationIndustry"]');
	}

	public industrySelect(): Locator {
		return this.page.locator('.rcx-options .rcx-option:first-child');
	}

	public size(): Locator {
		return this.page.locator('[name="organizationSize"]');
	}

	public sizeSelect(): Locator {
		return this.page.locator('.rcx-options .rcx-option:first-child');
	}

	public country(): Locator {
		return this.page.locator('[name="country"]');
	}

	public countrySelect(): Locator {
		return this.page.locator('.rcx-options .rcx-option:first-child');
	}

	public registeredServer(): Locator {
		return this.page.locator('input[name=email]');
	}

	public registerButton(): Locator {
		return this.page.locator('//button[contains(text(), "Register")]');
	}

	public agreementField(): Locator {
		return this.page.locator('//input[@name="agreement"]/../i[contains(@class, "rcx-check-box")]');
	}

	public standaloneServer(): Locator {
		return this.page.locator('//button[contains(text(), "Continue as standalone")]');
	}

	public standaloneConfirmText(): Locator {
		return this.page.locator('//*[contains(text(), "Standalone Server Confirmation")]');
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

	public organizationNameInvalidText(): Locator {
		return this.page.locator('//input[@name="organizationName"]/../following-sibling::span');
	}

	public passwordInvalidText(): Locator {
		return this.page.locator('//input[@name="password"]/../../../span[contains(@class, "rcx-field__error")]');
	}

	public industryInvalidSelect(): Locator {
		return this.page.locator('//div[@name="organizationIndustry"]/../following-sibling::span');
	}

	public sizeInvalidSelect(): Locator {
		return this.page.locator('//div[@name="organizationSize"]/../following-sibling::span');
	}

	public countryInvalidSelect(): Locator {
		return this.page.locator('//div[@name="country"]/../following-sibling::span');
	}

	public invalidInputEmail(): Locator {
		return this.page.locator('$$("input:invalid")');
	}

	public async login(): Promise<void> {
		const loginObj = new LoginPage(this.browser, this.baseURL);
		await loginObj.login({ email: adminEmail, password: adminPassword });
	}

	public async goNext(): Promise<void> {
		await this.nextStep().click();
	}

	public async stepOneSucess(): Promise<void> {
		await this.fullName().type(adminUsername);
		await this.userName().type(adminUsername);
		await this.companyEmail().type(adminEmail);
		await this.password().type(adminPassword);
		await this.goNext();
	}

	public async stepTwoSucess(): Promise<void> {
		await this.organizationName().type(reason);

		await this.organizationType().click();
		await this.organizationTypeSelect().click();
		await expect(this.getPage().locator('.rcx-options')).toHaveCount(0);

		await this.industry().click();
		await this.industrySelect().click();
		await expect(this.getPage().locator('.rcx-options')).toHaveCount(0);

		await this.size().click();
		await this.sizeSelect().click();
		await expect(this.getPage().locator('.rcx-options')).toHaveCount(0);

		await this.country().click();
		await this.countrySelect().click();

		await this.goNext();
	}

	public async stepThreeSucess(): Promise<void> {
		await this.standaloneServer().click();
	}

	// goToHome() {
	// 	this.goToWorkspace.click();
	// }
}

export default SetupWizard;
