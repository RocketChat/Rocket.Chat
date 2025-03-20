import type { Page } from '@playwright/test';

export class HomeFlextabMembers {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	memberOption(username: string) {
		return this.page.getByRole('dialog').locator('li', { hasText: username });
	}

	async openMemberInfo(username: string) {
		await this.memberOption(username).click();
	}

	getMenuItemAction(action: string) {
		return this.page.locator(`role=menuitem[name="${action}"]`);
	}

	async openMoreActions() {
		await this.page.locator('role=button[name="More"]').click();
	}

	async openMemberOptionMoreActions(username: string) {
		await this.memberOption(username).hover();
		await this.memberOption(username).locator('role=button[name="More"]').click();
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
		await this.openMemberOptionMoreActions(username);
		await this.getMenuItemAction('Mute user').click();
		await this.page.locator('.rcx-modal .rcx-button--danger').click();
		await this.page.getByRole('dialog').getByRole('button').first().click();
	}

	async unmuteUser(username: string) {
		await this.openMemberOptionMoreActions(username);
		await this.getMenuItemAction('Unmute user').click();
	}

	async setUserAsModerator(username: string) {
		await this.openMemberOptionMoreActions(username);
		await this.getMenuItemAction('Set as moderator').click();
	}

	async setUserAsOwner(username: string) {
		await this.openMemberOptionMoreActions(username);
		await this.getMenuItemAction('Set as owner').click();
	}

	async showAllUsers() {
		const selectInput = this.page.getByRole('button', { name: 'Online' });
		await selectInput.click();
		await this.page.getByRole('listbox').getByRole('option', { name: 'All' }).click();
	}

	private async ignoreUserAction(action: string, username: string) {
		await this.openMemberInfo(username);
		await this.openMoreActions();
		await this.getMenuItemAction(action).click();
	}

	async ignoreUser(username: string) {
		await this.ignoreUserAction('Ignore', username);
	}

	async unignoreUser(username: string) {
		await this.ignoreUserAction('Unignore', username);
	}

	get confirmRemoveUserModal() {
		return this.page.getByRole('dialog', { name: 'Confirmation', exact: true });
	}

	async confirmRemoveUser() {
		return this.confirmRemoveUserModal.getByRole('button', { name: 'Remove', exact: true }).click();
	}
}
