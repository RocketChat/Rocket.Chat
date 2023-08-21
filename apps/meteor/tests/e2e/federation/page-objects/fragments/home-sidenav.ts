import type { Locator, Page } from '@playwright/test';

export class FederationSidenav {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get checkboxPrivateChannel(): Locator {
		return this.page.locator(
			'//*[@id="modal-root"]//*[contains(@class, "rcx-field") and contains(text(), "Private")]/../following-sibling::label/i',
		);
	}

	get checkboxFederatedChannel(): Locator {
		return this.page.locator(
			'//*[@id="modal-root"]//*[contains(@class, "rcx-field") and contains(text(), "Federated")]/../following-sibling::label/i',
		);
	}

	get autocompleteUser(): Locator {
		return this.page.locator('//*[@id="modal-root"]//*[contains(@class, "rcx-box--full") and contains(text(), "Add Members")]/..//input');
	}

	get autocompleteUserDM(): Locator {
		return this.page.locator('//*[@id="modal-root"]//*[contains(@class, "rcx-box--full")]/..//input');
	}

	get inputChannelName(): Locator {
		return this.page.locator('#modal-root [data-qa="create-channel-modal"] [data-qa-type="channel-name-input"]');
	}

	get btnCreateChannel(): Locator {
		return this.page.locator('//*[@id="modal-root"]//button[contains(text(), "Create")]');
	}

	async logout(): Promise<void> {
		await this.page.locator('[data-qa="sidebar-avatar-button"]').click();
		await this.page.locator('//*[contains(@class, "rcx-option__content") and contains(text(), "Logout")]').click();
	}

	async inviteUserToChannel(username: string) {
		await this.autocompleteUser.click();
		await this.autocompleteUser.type(username);
		await this.page.locator('[data-qa-type="autocomplete-user-option"]', { hasText: username }).waitFor();
		await this.page.locator('[data-qa-type="autocomplete-user-option"]', { hasText: username }).click();
	}

	async openAdministrationByLabel(text: string): Promise<void> {
		await this.page.locator('role=button[name="Administration"]').click();
		await this.page.locator(`li.rcx-option >> text="${text}"`).click();
	}

	async openNewByLabel(text: string): Promise<void> {
		await this.page.locator('[data-qa="sidebar-create"]').click();
		await this.page.locator(`li.rcx-option >> text="${text}"`).click();
	}

	async openChat(name: string): Promise<void> {
		await this.page.locator('role=navigation >> role=button[name=Search]').click();
		await this.page.locator('role=search >> role=searchbox').focus();
		await this.page.locator('role=search >> role=searchbox').type(name);
		await this.page.locator(`role=search >> role=listbox >> role=link`).first().waitFor();
		await this.page.locator(`role=search >> role=listbox >> role=link`).first().click();
	}

	async countFilteredChannelsOnDirectory(name: string): Promise<number> {
		await this.page.locator('button[title="Directory"]').click();
		await this.page.locator('button:has-text("Channels")').click();
		await this.page.locator('input[placeholder ="Search Channels"]').focus();
		await this.page.locator('input[placeholder ="Search Channels"]').type(name, { delay: 100 });
		await this.page.waitForTimeout(5000);

		return this.page.locator('table tbody tr').count();
	}

	async openChatWhenHaveMultipleWithTheSameName(name: string, item: number): Promise<void> {
		await this.page.locator('role=navigation >> role=button[name=Search]').click();
		await this.page.locator('role=search >> role=searchbox').focus();
		await this.page.locator('role=search >> role=searchbox').type(name);
		await this.page.waitForTimeout(2000);
		await this.page.locator(`role=search >> role=listbox >> role=link >> text="${name}"`).nth(item).click({ force: true });
	}

	async countRoomsByNameOnSearch(name: string): Promise<number> {
		await this.page.locator('role=navigation >> role=button[name=Search]').click();
		await this.page.locator('role=search >> role=searchbox').focus();
		await this.page.locator('role=search >> role=searchbox').type(name);
		await this.page.locator(`role=search >> role=listbox >> role=link >> text="${name}"`).waitFor();
		await this.page.waitForTimeout(2000);

		return this.page.locator(`role=search >> role=listbox >> role=link >> text="${name}"`).count();
	}

	async openDMMultipleChat(name: string): Promise<void> {
		await this.page.locator('role=navigation >> role=button[name=Search]').click();
		await this.page.locator('role=search >> role=searchbox').focus();
		await this.page.locator('role=search >> role=searchbox').type(name);
		await this.page.locator(`role=search >> role=listbox >> role=link >> text="${name}"`).waitFor();
		await this.page.locator(`.rcx-sidebar-item`).nth(1).click({ force: true });
	}

	async createPublicChannel(name: string) {
		await this.openNewByLabel('Channel');
		await this.checkboxPrivateChannel.click();
		await this.inputChannelName.type(name);
		await this.btnCreateChannel.click();
	}

	async inviteUserToDM(username: string) {
		await this.autocompleteUserDM.click();
		await this.autocompleteUserDM.type(username);
		await this.page.locator('[data-qa-type="autocomplete-user-option"]', { hasText: username }).waitFor();
		await this.page.locator('[data-qa-type="autocomplete-user-option"]', { hasText: username }).click();
	}
}
