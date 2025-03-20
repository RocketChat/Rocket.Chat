import type { Locator, Page } from '@playwright/test';

export class AdminFlextabUsers {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get btnNewUser(): Locator {
		return this.page.locator('role=button[name="New user"]');
	}

	get btnSave(): Locator {
		return this.page.locator('role=button[name="Add user"]');
	}

	get btnInvite(): Locator {
		return this.page.locator('role=button[name="Invite"]');
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

	get inputSetManually(): Locator {
		return this.page.locator('//label[text()="Set manually"]');
	}

	get inputPassword(): Locator {
		return this.page.locator('input[placeholder="Password"]');
	}

	get inputConfirmPassword(): Locator {
		return this.page.locator('input[placeholder="Confirm password"]');
	}

	get checkboxVerified(): Locator {
		return this.page.locator('//label[text()="Mark email as verified"]');
	}

	get joinDefaultChannels(): Locator {
		return this.page.locator('//label[text()="Join default channels"]');
	}

	get userRole(): Locator {
		return this.page.locator('button[role="option"]:has-text("user")');
	}

	async addRole(role: string): Promise<void> {
		await this.page.locator('//label[text()="Roles"]/following-sibling::span//input').click();
		await this.page.locator(`li[value=${role}]`).click();
	}

	get setupSmtpLink(): Locator {
		return this.page.locator('role=link[name="Set up SMTP"]');
	}

	get btnContextualbarClose(): Locator {
		return this.page.locator('button[data-qa="ContextualbarActionClose"]');
	}
}
