import type { Page } from '@playwright/test';

import { OmnichannelSidenav } from './fragments';

export class OmnichannelTriggers {
	private readonly page: Page;

	readonly sidenav: OmnichannelSidenav;

	constructor(page: Page) {
		this.page = page;
		this.sidenav = new OmnichannelSidenav(page);
	}

	get btnNew() {
		return this.page.locator('button.rcx-button >> text="New"');
	}

	get btnEnabled() {
		return this.page.locator('[data-qa="TriggerToggle-Enabled"] span label');
	}

	get btnRunOnce() {
		return this.page.locator('[data-qa="TriggerToggle-RunOnce"] span label');
	}

	get inputName() {
		return this.page.locator('[data-qa="TriggerTextInput-Name"]');
	}

	get inputDescription() {
		return this.page.locator('[data-qa="TriggerTextInput-Description"]');
	}

	get inputConditionValue() {
		return this.page.locator('[data-qa="TriggerTextInput-ConditionValue"]');
	}

	get inputActionAgentName() {
		return this.page.locator('[data-qa="TriggerTextInput-ActionAgentName"]');
	}

	get inputActionMsg() {
		return this.page.locator('[data-qa="TriggerTextAreaInput-ActionMsg"]');
	}

	get firstRowInTable() {
		return this.page.locator('table tr:first-child td:first-child');
	}

	get btnDeleteFirstRowInTable() {
		return this.page.locator('table tr:first-child td:nth-child(6) button');
	}

	get btnSave() {
		return this.page.locator('button.rcx-button--primary.rcx-button >> text="Save"');
	}

	get btnModalConfirmDelete() {
		return this.page.locator('#modal-root .rcx-modal .rcx-modal__footer .rcx-button--danger');
	}

	findTdByName(name: string) {
		return this.page.locator(`td >> text="${name}"`);
	}

	findRowByName(name: string) {
		return this.page.locator('tr', { has: this.findTdByName(name) });
	}

	findTriggerRemoveBtn(name: string) {
		return this.findRowByName(name).locator('button.rcx-button');
	}
}
