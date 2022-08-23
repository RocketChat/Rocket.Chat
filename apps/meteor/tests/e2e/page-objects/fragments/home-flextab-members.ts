import type { Page } from '@playwright/test';

export class HomeFlextabMembers {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	async addUser(username: string) {
		await this.page.locator('//button[contains(text(), "Add")]').click();
		await this.page.locator('//label[contains(text(), "Choose users")]/..//input').type(username);
		await this.page.locator(`[data-qa-type="autocomplete-user-option"] >> text=${username}`).first().click();
		await this.page.locator('//button[contains(text(), "Add users")]').click();
	}

	async inviteUser() {
		await this.page.locator('//button[contains(text(), "Invite Link")]').click();
	}

	async muteUser(username: string) {
		await this.page.locator(`[data-qa="MemberItem-${username}"]`).click();
		await this.page.locator('[data-qa="UserUserInfo-menu"]').click();
		await this.page.locator('[value="muteUser"]').click();
		await this.page.locator('.rcx-modal .rcx-button--danger').click();
		await this.page.locator('(//main//aside/h3//button)[1]').click();
	}

	async setUserAsModerator(username: string) {
		await this.page.locator(`[data-qa="MemberItem-${username}"]`).click();
		await this.page.locator('[data-qa="UserUserInfo-menu"]').click();
		await this.page.locator('[value="changeModerator"]').click();
	}

	async setUserAsOwner(username: string) {
		await this.page.locator(`[data-qa="MemberItem-${username}"]`).click();
		await this.page.locator('//main//aside//button[contains(text(), "Set as owner")]').click();
	}

	async showAllUsers() {
		await this.page.locator('.rcx-select >> text=Online').first().click();
		await this.page.locator('.rcx-option__content:has-text("All")').first().click();
	}
}
