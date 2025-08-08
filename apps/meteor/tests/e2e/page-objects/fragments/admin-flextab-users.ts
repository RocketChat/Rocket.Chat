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

	get btnSaveUser(): Locator {
		return this.page.locator('role=button[name="Save user"]');
	}

	get btnMoreActions(): Locator {
		return this.page.locator('role=button[name="More"]');
	}

	get btnDeleteUser(): Locator {
		return this.page.locator('role=menuitem[name="Delete"]');
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

	get rolesSelect(): Locator {
		return this.page.locator('//label[text()="Roles"]/following-sibling::span//input');
	}

	findRoleInList(role: string): Locator {
		return this.page.locator(`li[value=${role}]`);
	}

	async addRole(role: string): Promise<void> {
		await this.rolesSelect.click();
		await this.findRoleInList(role).click();
	}

	get setupSmtpLink(): Locator {
		return this.page.locator('role=link[name="Set up SMTP"]');
	}

	get btnContextualbarClose(): Locator {
		return this.page.locator('button[data-qa="ContextualbarActionClose"]');
	}

	getCustomField(fieldName: string): Locator {
		return this.page.getByRole('textbox', { name: fieldName });
	}
}
