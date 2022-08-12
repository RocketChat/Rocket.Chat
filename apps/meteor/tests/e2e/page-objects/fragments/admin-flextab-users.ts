import type { Locator, Page } from '@playwright/test';

export class AdminFlextabUsers {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get btnNew(): Locator {
		return this.page.locator('//button[text()="New"]');
	}

	get btnSave(): Locator {
		return this.page.locator('//button[text()="Save"]');
	}

	get inputName(): Locator {
		return this.page.locator('//label[text()="Name"]/following-sibling::span//input');
	}

	get inputUserName(): Locator {
		return this.page.locator('//label[text()="Username"]/following-sibling::span//input');
	}

	get inputEmail(): Locator {
		return this.page.locator('//label[text()="Email"]/following-sibling::span//input').first();
	}

	get inputPassword(): Locator {
		return this.page.locator('//label[text()="Password"]/following-sibling::span//input');
	}

	get checkboxVerified(): Locator {
		return this.page.locator('//label[text()="Email"]/following-sibling::span//input/following-sibling::i');
	}

	async addRole(role: string): Promise<void> {
		await this.page.locator('//label[text()="Roles"]/following-sibling::span//input').click();
		await this.page.locator(`li[value=${role}]`).click();
	}
}
