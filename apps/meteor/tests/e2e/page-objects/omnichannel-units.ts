import type { Locator } from '@playwright/test';

import { OmnichannelAdministration } from './omnichannel-administration';

export class OmnichannelUnits extends OmnichannelAdministration {
	get inputSearch() {
		return this.page.getByRole('main').getByRole('textbox', { name: 'Search' });
	}

	async search(text: string) {
		await this.inputSearch.fill(text);
	}

	findRowByName(name: string) {
		return this.page.locator(`tr[data-qa-id="${name}"]`);
	}

	btnRemoveByName(name: string) {
		return this.findRowByName(name).locator('role=button[name="remove"]');
	}

	get inputName() {
		return this.page.locator('[name="name"]');
	}

	get inputDepartments() {
		return this.page.locator('[name="departments"]').locator('input[placeholder="Select an option"]');
	}

	get inputMonitors() {
		return this.page.locator('[name="monitors"]');
	}

	get inputVisibility(): Locator {
		return this.page.locator('button', { has: this.page.locator('select[name="visibility"]') });
	}

	get btnContextualbarClose(): Locator {
		return this.page.locator('[data-qa="ContextualbarActionClose"]');
	}

	private selectOption(name: string) {
		return this.page.locator(`[role=option][value="${name}"]`);
	}

	public selectOptionChip(name: string) {
		return this.page.getByRole('option', { name });
	}

	async selectDepartment({ name, _id }: { name: string; _id: string }) {
		await this.inputDepartments.click();
		await this.inputDepartments.fill(name);
		await this.selectOption(_id).click();
		await this.contextualBar.click({ position: { x: 0, y: 0 } });
	}

	async selectMonitor(option: string) {
		await this.inputMonitors.click();
		await this.selectOption(option).click();
		await this.contextualBar.click({ position: { x: 0, y: 0 } });
	}

	async selectVisibility(option: string) {
		await this.inputVisibility.click();
		await this.page.locator(`li.rcx-option[data-key="${option}"]`).click();
	}

	get btnCreateUnit() {
		return this.page.locator('header').locator('role=button[name="Create unit"]');
	}

	get btnCreateUnitEmptyState() {
		return this.page.locator('.rcx-states').locator('role=button[name="Create unit"]');
	}

	get contextualBar() {
		return this.page.locator('div[data-qa-id="units-contextual-bar"]');
	}

	get btnSave() {
		return this.contextualBar.locator('role=button[name="Save"]');
	}

	get btnCancel() {
		return this.contextualBar.locator('role=button[name="Cancel"]');
	}

	get btnDelete() {
		return this.contextualBar.locator('role=button[name="Delete"]');
	}

	btnDeleteByName(name: string) {
		return this.page.locator(`button[data-qa-id="remove-unit-${name}"]`);
	}

	get confirmDeleteModal() {
		return this.page.locator('dialog[data-qa-id="units-confirm-delete-modal"]');
	}

	get btnCancelDeleteModal() {
		return this.confirmDeleteModal.locator('role=button[name="Cancel"]');
	}

	get btnConfirmDeleteModal() {
		return this.confirmDeleteModal.locator('role=button[name="Delete"]');
	}
}
