import type { Locator, Page } from '@playwright/test';

export class FederationSidenav {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get checkboxFederatedChannel(): Locator {
		return this.page.locator(
			'//*[@id="modal-root"]//*[contains(@class, "rcx-field") and contains(text(), "Federated")]/../following-sibling::label/i',
		);
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
}
