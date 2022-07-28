import { Locator, Page } from '@playwright/test';

export class AdminFlextab {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get usersAddUserTab(): Locator {
		return this.page.locator('//button[text()="New"]');
	}

	get usersAddUserName(): Locator {
		return this.page.locator('//label[text()="Name"]/following-sibling::span//input');
	}

	get usersAddUserUsername(): Locator {
		return this.page.locator('//label[text()="Username"]/following-sibling::span//input');
	}

	get usersAddUserEmail(): Locator {
		return this.page.locator('//label[text()="Email"]/following-sibling::span//input').first();
	}

	get usersAddUserVerifiedCheckbox(): Locator {
		return this.page.locator('//label[text()="Email"]/following-sibling::span//input/following-sibling::i');
	}

	get usersAddUserPassword(): Locator {
		return this.page.locator('//label[text()="Password"]/following-sibling::span//input');
	}

	get usersAddUserRoleList(): Locator {
		return this.page.locator('//label[text()="Roles"]/following-sibling::span//input');
	}

	get usersButtonSave(): Locator {
		return this.page.locator('//button[text()="Save"]');
	}

	get usersAddUserRandomPassword(): Locator {
		return this.page.locator('//div[text()="Set random password and send by email"]/following-sibling::label//input');
	}

	get usersAddUserChangePasswordCheckbox(): Locator {
		return this.page.locator('//div[text()="Require password change"]/following-sibling::label//input');
	}

	get usersAddUserDefaultChannelCheckbox(): Locator {
		return this.page.locator('//div[text()="Join default channels"]/following-sibling::label//input');
	}

	get usersAddUserWelcomeEmailCheckbox(): Locator {
		return this.page.locator('//div[text()="Send welcome email"]/following-sibling::label//input');
	}

	get usersButtonCancel(): Locator {
		return this.page.locator('//button[text()="Cancel"]');
	}

	get usersAddUserTabClose(): Locator {
		return this.page.locator('//div[text()="Add User"]//button');
	}

	get addUserTable(): Locator {
		return this.page.locator('//div[text()="Add User"]');
	}

	async doAddRole(role: string): Promise<void> {
		await this.usersAddUserRoleList.click();
		await this.page.locator(`li[value=${role}]`).click();
	}
}
