import { Locator, Page } from '@playwright/test';

import { Login } from './Login';

export class Wizard {
	page: Page;

	login: Login;

	constructor(page: Page) {
		this.page = page;
		this.login = new Login(page);
	}

	get registeredServer(): Locator {
		return this.page.locator('input[name=email]');
	}

	getBtnPrimary(input: { text: string }): Locator {
		return this.page.locator(`.rcx-button--primary.rcx-button >> text="${input.text}"`);
	}

	async doClickAgreementField(): Promise<void> {
		await this.page.$eval('[name="agreement"]', (el) => el.parentElement?.click());
	}

	get btnStandaloneServer(): Locator {
		return this.page.locator('.rcx-button--nude-info.rcx-button.rcx-button-group__item >> text="Continue as standalone"');
	}

	get textStandaloneServerConfirmation(): Locator {
		return this.page.locator('.rcx-box.rcx-box--full >> text="Standalone Server Confirmation"');
	}

	textInvalidInput(element: { nthElement: number }): Locator {
		return this.page.locator('.rcx-field__error').nth(element.nthElement);
	}

	async clickInSelectors(select: { selector: string }): Promise<void> {
		await this.page.locator(select.selector).click();
		await this.page.locator('.rcx-option:first-child').first().click();
	}

	async doGoToStepTwoSuccess(): Promise<void> {
		const selectors = ['[name="organizationType"]', '[name="organizationIndustry"]', '[name="organizationSize"]', '[name="country"]'];
		await this.page.locator('[name="organizationName"]').type('rocket.chat.reason');
		for await (const selector of selectors) {
			await this.clickInSelectors({ selector });
		}
		await this.getBtnPrimary({ text: 'Next' }).click();
	}
}
