import type { Locator, Page } from '@playwright/test';

export class FederationHomeFlextabMembers {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	getUserInList(username: string): Locator {
		return this.page.locator(`[data-qa="MemberItem-${username}"]`);
	}

	get addUsersButton(): Locator {
		return this.page.locator('//button[contains(text(), "Add")]');
	}

	async addMultipleUsers(usernames: string[]) {
		await this.addUsersButton.click();
		for await (const username of usernames) {
			await this.page.locator('//label[contains(text(), "Choose users")]/..//input').type(username);
			await this.page.waitForTimeout(2000);
			await this.page.locator(`[data-qa-type="autocomplete-user-option"] >> text=${username}`).first().click();
		}
		await this.addUsersButton.click();
		await this.page.waitForTimeout(2000);
	}

	async showAllUsers() {
		await this.page.locator('.rcx-select >> text=Online').first().click();
		await this.page.locator('.rcx-option__content:has-text("All")').first().click();
	}
}
