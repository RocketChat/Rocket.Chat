import { expect, Locator } from '@playwright/test';

import { BasePage } from './BasePage';
import { reason, INVALID_EMAIL_WITHOUT_MAIL_PROVIDER } from '../utils/mocks/userAndPasswordMock';
import { IRegister } from '../utils/interfaces/Login';
import { BACKSPACE } from '../utils/mocks/keyboardKeyMock';

export class SetupWizard extends BasePage {
	get btnConfirm(): Locator {
		return this.page.locator('//button[contains(text(), "Confirm")]');
	}

	private get btnNextStep(): Locator {
		return this.page.locator('//button[contains(text(), "Next")]');
	}

	private get inputFullName(): Locator {
		return this.page.locator('[name="fullname"]');
	}

	private get inputUserName(): Locator {
		return this.page.locator('[name="username"]');
	}

	private get inputCompanyEmail(): Locator {
		return this.page.locator('[name="companyEmail"]');
	}

	private get inputPassword(): Locator {
		return this.page.locator('[name="password"]');
	}

	private get inputOrganizationType(): Locator {
		return this.page.locator('[name="organizationType"]');
	}

	private get selectOrganizationType(): Locator {
		return this.page.locator('.rcx-options .rcx-option:first-child');
	}

	private get inputOrganizationName(): Locator {
		return this.page.locator('[name="organizationName"]');
	}

	private get inputOrganizationIndustry(): Locator {
		return this.page.locator('[name="organizationIndustry"]');
	}

	private get selectIndustry(): Locator {
		return this.page.locator('.rcx-options .rcx-option:first-child');
	}

	private get organizationSize(): Locator {
		return this.page.locator('[name="organizationSize"]');
	}

	private get selectOrganizationSize(): Locator {
		return this.page.locator('.rcx-options .rcx-option:first-child');
	}

	private get inputCountry(): Locator {
		return this.page.locator('[name="country"]');
	}

	private selectCountry(): Locator {
		return this.page.locator('.rcx-options .rcx-option:first-child');
	}

	get inputRegisteredServer(): Locator {
		return this.page.locator('input[name=email]');
	}

	get btnRegister(): Locator {
		return this.page.locator('//button[contains(text(), "Register")]');
	}

	get checkboxAgreement(): Locator {
		return this.page.locator('//input[@name="agreement"]/../i[contains(@class, "rcx-check-box")]');
	}

	get standaloneServer(): Locator {
		return this.page.locator('//button[contains(text(), "Continue as standalone")]');
	}

	get textStandaloneConfirm(): Locator {
		return this.page.locator('//*[contains(text(), "Standalone Server Confirmation")]');
	}

	private get textInvalidfullName(): Locator {
		return this.page.locator('//input[@name="fullname"]/../following-sibling::span');
	}

	private get textInvalidUserName(): Locator {
		return this.page.locator('//input[@name="username"]/../following-sibling::span');
	}

	private get textInvalidCompanyEmail(): Locator {
		return this.page.locator('//input[@name="companyEmail"]/../following-sibling::span');
	}

	private get textInvalidPassword(): Locator {
		return this.page.locator('//input[@name="password"]/../../../span[contains(@class, "rcx-field__error")]');
	}

	private get textInvalidEmail(): Locator {
		return this.page.locator('//input[@name="email"]/../../span[contains(text(), "This field is required")]');
	}

	private get textInvalidOrganizationIndustry(): Locator {
		return this.page.locator('//div[@name="organizationIndustry"]/../following-sibling::span');
	}

	private get textInvalidOrganizationSize(): Locator {
		return this.page.locator('//div[@name="organizationSize"]/../following-sibling::span');
	}

	private get textInvalidCountry(): Locator {
		return this.page.locator('//div[@name="country"]/../following-sibling::span');
	}

	async stepTwoSuccess(): Promise<void> {
		await this.inputOrganizationName.type(reason);

		await this.inputOrganizationType.click();
		await this.selectOrganizationType.click();
		await expect(this.page.locator('.rcx-options')).toHaveCount(0);

		await this.inputOrganizationIndustry.click();
		await this.selectIndustry.click();
		await expect(this.page.locator('.rcx-options')).toHaveCount(0);

		await this.organizationSize.click();
		await this.selectOrganizationSize.click();
		await expect(this.page.locator('.rcx-options')).toHaveCount(0);

		await this.inputCountry.click();
		await this.selectCountry().click();

		await this.btnNextStep.click();
	}

	async stepThreeSuccess(): Promise<void> {
		await this.standaloneServer.click();
	}

	async stepOneFailedBlankFields(): Promise<void> {
		await this.btnNextStep.click();

		await expect(this.textInvalidfullName).toBeVisible();
		await expect(this.textInvalidUserName).toBeVisible();
		await expect(this.textInvalidCompanyEmail).toBeVisible();
		await expect(this.textInvalidPassword).toBeVisible();
	}

	async stepOneFailedWithInvalidEmail(adminCredentials: IRegister): Promise<void> {
		await this.inputFullName.type(adminCredentials.name);
		await this.inputUserName.type(adminCredentials.name);
		await this.inputCompanyEmail.type(INVALID_EMAIL_WITHOUT_MAIL_PROVIDER);
		await this.inputPassword.type(adminCredentials.password);

		await this.btnNextStep.click();

		await expect(this.inputCompanyEmail).toBeFocused();
	}

	async stepTwoFailedWithBlankFields(): Promise<void> {
		await this.btnNextStep.click();

		// await expect(this.organizationName()).toBeVisible();
		await expect(this.textInvalidOrganizationIndustry).toBeVisible();
		await expect(this.textInvalidOrganizationSize).toBeVisible();
		await expect(this.textInvalidCountry).toBeVisible();
	}

	async stepThreeFailedWithInvalidField(): Promise<void> {
		await this.inputRegisteredServer.type(INVALID_EMAIL_WITHOUT_MAIL_PROVIDER);
		await this.inputRegisteredServer.click({ clickCount: 3 });
		await this.keyPress(BACKSPACE);

		await expect(this.textInvalidEmail).toBeVisible();
	}
}
