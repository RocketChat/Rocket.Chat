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
		return this.page.locator('input[name="field"]');
	}

	get inputLabel(): Locator {
		return this.page.locator('input[name="label"]');
	}

	get visibleLabel(): Locator {
		return this.page.locator('label >> text="Visible"');
	}

	get btnSave(): Locator {
		return this.page.locator('button >> text=Save');
	}

	get inputSearch(): Locator {
		return this.page.locator('[placeholder="Search"]');
	}

	firstRowInTable(filedName: string) {
		return this.page.locator(`[qa-user-id="${filedName}"]`);
	}

	get btnDeleteCustomField() {
		return this.page.locator('button >> text=Delete');
	}

	get btnModalRemove(): Locator {
		return this.page.locator('#modal-root dialog .rcx-modal__inner .rcx-modal__footer .rcx-button--danger');
	}
}
