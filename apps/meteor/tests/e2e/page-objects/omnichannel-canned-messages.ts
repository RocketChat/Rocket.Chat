import type { Locator, Page } from '@playwright/test';

import { OmnichannelSidenav } from './fragments';

export class OmnichannelCannedResponses {
	private readonly page: Page;

	readonly sidenav: OmnichannelSidenav;

	constructor(page: Page) {
		this.page = page;
		this.sidenav = new OmnichannelSidenav(page);
	}

	get btnNew(): Locator {
		return this.page.locator('[data-title="New Canned Response"]');
	}

	get inputSearch(): Locator {
		return this.page.locator('[placeholder="Search"]');
	}

	get btnBack(): Locator {
		return this.page.locator('button.rcx-button >> text="Back"');
	}

	get btnSave(): Locator {
		return this.page.locator('button.rcx-button >> text="Save"');
	}

	get inputShortcut(): Locator {
		return this.page.locator('[name=shortcut]');
	}

	get textareaMessage(): Locator {
		return this.page.locator('textarea.rcx-input-box--type-textarea');
	}

	get selectedRowInTable() {
		return this.page.locator('.rcx-table__row--action .rcx-table__cell >> text="TestCannedResponse"');
	}

	get btnDeletefirstRowInTable() {
		return this.page.locator('.rcx-table__row--action .rcx-table__cell >> text="TestCannedResponse" ~ button[title="Remove"]');
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
}
