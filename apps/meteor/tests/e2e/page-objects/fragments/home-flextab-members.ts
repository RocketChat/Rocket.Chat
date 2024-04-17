import type { Page } from '@playwright/test';

export class HomeFlextabMembers {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	memberOption(username: string) {
		return this.page.getByRole('dialog').locator('li', { hasText: username });
	}

	getMenuItemAction(action: string) {
		return this.page.locator(`role=menuitem[name="${action}"]`);
	}

	async addUser(username: string) {
		await this.page.locator('role=button[name="Add"]').click();
		await this.page.locator('//label[contains(text(), "Choose users")]/..//input').fill(username);
		await this.page.locator(`[data-qa-type="autocomplete-user-option"] >> text=${username}`).first().click();
		await this.page.locator('role=button[name="Add users"]').click();
	}

	async inviteUser() {
		await this.page.locator('role=button[name="Invite Link"]').click();
	}

	async muteUser(username: string) {
		await this.memberOption(username).hover();
		await this.memberOption(username).locator('role=button[name="More"]').click();
		await this.page.locator('role=menuitem[name="Mute user"]').click();
		await this.page.locator('.rcx-modal .rcx-button--danger').click();
		await this.page.getByRole('dialog').getByRole('button').first().click();
	}

	async openMoreActions() {
		await this.page.locator('role=button[name="More"]').click();
	}

	async openUserInfo(username: string) {
		await this.page.locator(`[data-qa="MemberItem-${username}"]`).click();
	}

	private async ignoreUserAction(action: string, username: string) {
		await this.openUserInfo(username);
		await this.openMoreActions();
		await this.getMenuItemAction(action).click();
	}

	async ignoreUser(username: string) {
		await this.ignoreUserAction('Ignore', username);
	}

	async unignoreUser(username: string) {
		await this.ignoreUserAction('Unignore', username);
	}

	async setUserAsModerator(username: string) {
		await this.memberOption(username).hover();
		await this.memberOption(username).locator('role=button[name="More"]').click();
		await this.page.locator('role=menuitem[name="Set as moderator"]').click();
	}

	async setUserAsOwner(username: string) {
		await this.memberOption(username).hover();
		await this.memberOption(username).locator('role=button[name="More"]').click();
		await this.page.locator('role=menuitem[name="Set as owner"]').click();
	}

	async showAllUsers() {
		await this.page.locator('.rcx-select >> text=Online').first().click();
		await this.page.locator('.rcx-option:has-text("All")').first().click();
	}
}
