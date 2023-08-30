import type { Locator, Page } from '@playwright/test';

import { OmnichannelSidenav } from './fragments';

export class OmnichannelManager {
	private readonly page: Page;

	readonly sidenav: OmnichannelSidenav;

	constructor(page: Page) {
		this.page = page;
		this.sidenav = new OmnichannelSidenav(page);
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
