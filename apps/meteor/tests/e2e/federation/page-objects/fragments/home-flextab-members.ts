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
		return this.page.locator('role=button[name="Add"]');
	}

	get btnRemoveUserFromRoom(): Locator {
		return this.page.locator('[value="removeUser"]');
	}

	get btnMenuUserInfo(): Locator {
		return this.page.locator('[data-qa="UserUserInfo-menu"]');
	}

	getKebabMenuForUser(username: string): Locator {
		return this.page.locator(`[data-username="${username}"] [data-testid="menu"]`);
	}

	async getOptionFromKebabMenuForUser(optionName: string): Promise<Locator> {
		return this.page.locator(`ol li[value="${optionName}"].rcx-option`);
	}

	async removeUserFromRoom(username: string): Promise<void> {
		await this.getUserInList(username).hover();
		await this.getKebabMenuForUser(username).click();
		await (await this.getOptionFromKebabMenuForUser('removeUser')).click();
		await this.page.locator('#modal-root dialog .rcx-modal__inner .rcx-modal__footer .rcx-button--danger').click();
	}

	async addMultipleUsers(usernames: string[]) {
		await this.addUsersButton.click();
		for await (const username of usernames) {
			await this.page.locator('//label[contains(text(), "Choose users")]/..//input').type(username);
			await this.page.locator(`[data-qa-type="autocomplete-user-option"] >> text=${username}`).waitFor();
			await this.page.locator(`[data-qa-type="autocomplete-user-option"] >> text=${username}`).first().click();
		}
		await this.addUsersButton.click();
	}

	async showAllUsers() {
		await this.page.locator('.rcx-select >> text=Online').first().click();
		await this.page.locator('.rcx-option:has-text("All")').first().click();
	}
}
