import type { Locator, Page } from '@playwright/test';

import { OmnichannelSidenav } from './fragments';

export class OmnichannelCustomFields {
	private readonly page: Page;

	readonly sidenav: OmnichannelSidenav;

	constructor(page: Page) {
		this.page = page;
		this.sidenav = new OmnichannelSidenav(page);
	}

	get btnAdd(): Locator {
		return this.page.locator('[data-qa-id="CustomFieldPageBtnNew"]');
	}

	get inputField(): Locator {
		return this.page.locator('[placeholder="Field"]');
	}

	get inputLabel(): Locator {
		return this.page.locator('[placeholder="Label"]');
	}

	get btnSave(): Locator {
		return this.page.locator('[data-qa-id="NewCustomFieldsPageButtonSave"]');
	}

	get inputSearch(): Locator {
		return this.page.locator('[placeholder="Search"]');
	}

	get btnEditSave(): Locator {
		return this.page.locator('[data-qa-id="BtnSaveEditCustomFieldsPage"]');
	}

	firstRowInTable(filedName: string) {
		return this.page.locator(`[qa-user-id="${filedName}"]`);
	}

	get btnDeletefirstRowInTable() {
		return this.page.locator('button[title="Remove"]');
	}

	get btnModalRemove(): Locator {
		return this.page.locator('#modal-root dialog .rcx-modal__inner .rcx-modal__footer .rcx-button--danger');
	}
}
