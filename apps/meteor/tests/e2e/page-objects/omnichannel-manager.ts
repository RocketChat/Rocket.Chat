import type { Locator, Page } from '@playwright/test';

import { OmnichannelSidenav } from './fragments';

export class OmnichannelManager {
	private readonly page: Page;

	readonly sidenav: OmnichannelSidenav;

	constructor(page: Page) {
		this.page = page;
		this.sidenav = new OmnichannelSidenav(page);
	}

	get inputSearch() {
		return this.page.locator('[placeholder="Search"]');
	}

	async search(text: string) {
		await this.inputSearch.fill(text);
		await this.page.waitForTimeout(500);
	}

	async clearSearch() {
		await this.inputSearch.fill('');
		await this.page.waitForTimeout(500);
	}

	get inputUsername(): Locator {
		return this.page.locator('input').first();
	}

	get btnAdd(): Locator {
		return this.page.locator('button.rcx-button--primary.rcx-button >> text="Add manager"');
	}

	firstRowInTable(userId: string) {
		return this.page.locator(`[data-qa-id="GenericTableManagerInfoBody"] [qa-user-id="${userId}"]`);
	}

	get btnDeleteFirstRowInTable() {
		return this.page.locator('button[title="Remove"]');
	}

	btnDeleteSelectedAgent(text: string) {
		return this.page.locator('tr', { has: this.page.locator(`td >> text="${text}"`) }).locator('button[title="Remove"]');
	}

	get btnModalRemove(): Locator {
		return this.page.locator('#modal-root dialog .rcx-modal__inner .rcx-modal__footer .rcx-button--danger');
	}
}
