import type { Locator, Page } from '@playwright/test';

import { OmnichannelSidenav } from './fragments';

export class OmnichannelManager {
	private readonly page: Page;

	readonly sidenav: OmnichannelSidenav;

	constructor(page: Page) {
		this.page = page;
		this.sidenav = new OmnichannelSidenav(page);
	}

	private get inputSearch() {
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

	async selectUsername(username: string) {
		await this.inputUsername.fill(username);
		await this.page.locator(`role=option[name="${username}"]`).click();
	}

	get btnAdd(): Locator {
		return this.page.locator('button.rcx-button--primary.rcx-button >> text="Add manager"');
	}

	findRowByName(name: string) {
		return this.page.locator('role=table[name="Managers"] >> role=row', { has: this.page.locator(`role=cell[name="${name}"]`) });
	}

	btnDeleteSelectedAgent(text: string) {
		return this.page.locator('tr', { has: this.page.locator(`td >> text="${text}"`) }).locator('button[title="Remove"]');
	}

	get btnModalRemove(): Locator {
		return this.page.locator('#modal-root dialog .rcx-modal__inner .rcx-modal__footer .rcx-button--danger');
	}
}
