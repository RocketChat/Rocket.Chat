import type { Locator, Page } from '@playwright/test';

import { OmnichannelSidenav } from './fragments';

export class OmnichannelAgents {
	private readonly page: Page;

	readonly sidenav: OmnichannelSidenav;

	constructor(page: Page) {
		this.page = page;
		this.sidenav = new OmnichannelSidenav(page);
	}

	get inputUsername(): Locator {
		return this.page.locator('input').first();
	}

	get inputSearch(): Locator {
		return this.page.locator('[placeholder="Search"]');
	}

	get btnAdd(): Locator {
		return this.page.locator('button.rcx-button--primary.rcx-button >> text="Add"');
	}

	get firstRowInTable() {
		return this.page.locator('[data-qa="GenericTableAgentInfoBody"] .rcx-table__row--action .rcx-table__cell:first-child');
	}

	get btnDeletefirstRowInTable() {
		return this.page.locator('button[title="Remove"]');
	}

	get btnModalRemove(): Locator {
		return this.page.locator('#modal-root dialog .rcx-modal__inner .rcx-modal__footer .rcx-button--danger');
	}

	get btnEdit(): Locator {
		return this.page.locator('[data-qa="AgentInfoAction-Edit"]');
	}

	get btnStatus(): Locator {
		return this.page.locator('[data-qa="AgentEditTextInput-Status"]');
	}

	get btnSave(): Locator {
		return this.page.locator('[data-qa="AgentEditButtonSave"]');
	}
}
