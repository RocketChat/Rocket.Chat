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
		return this.page.getByRole('dialog', { name: 'User Info', exact: true }).getByRole('button', { name: 'More', exact: true });
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
			await this.page.getByRole('textbox', { name: 'Choose users' }).click();
			await this.page.getByRole('textbox', { name: 'Choose users' }).fill(username);

			await this.page.getByRole('listbox').waitFor();
			await this.page.getByRole('listbox').selectOption(username);
		}
		await this.addUsersButton.click();
	}

	async showAllUsers() {
		await this.page.locator('.rcx-select >> text=Online').first().click();
		await this.page.locator('.rcx-option:has-text("All")').first().click();
	}
}
