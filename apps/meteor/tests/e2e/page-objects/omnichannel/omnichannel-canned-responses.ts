import type { Locator, Page } from '@playwright/test';

import { OmnichannelAdmin } from './omnichannel-admin';
import { Table } from '../fragments/table';

class OmnichannelCannedResponsesTable extends Table {
	constructor(page: Page, fallback: Locator) {
		super(page.getByRole('table', { name: 'Canned Responses' }), fallback);
	}
}

export class OmnichannelCannedResponses extends OmnichannelAdmin {
	readonly table: OmnichannelCannedResponsesTable;

	constructor(page: Page) {
		super(page);
		this.table = new OmnichannelCannedResponsesTable(page, this.emptyState);
	}

	async goTo() {
		await this.goToRoute('canned-responses');
		await this.waitForPage();
	}

	private async waitForPage() {
		await this.getPageHeader('Canned Responses').waitFor({ state: 'visible' });
		await this.table.waitForDisplay();
	}

	get inputShortcut() {
		return this.page.getByRole('textbox', { name: 'Shortcut', exact: true });
	}

	get inputMessage() {
		return this.page.getByRole('textbox', { name: 'Message', exact: true });
	}

	get radioPublic() {
		return this.page.locator('label', { has: this.page.getByRole('radio', { name: 'Public' }) });
	}

	get radioPrivate() {
		return this.page.locator('label', { has: this.page.getByRole('radio', { name: 'Private' }) });
	}

	get inputTags() {
		return this.page.getByRole('textbox', { name: 'Tags', exact: true });
	}

	get btnAddTag() {
		return this.page.getByRole('button', { name: 'Add', exact: true });
	}

	listItem(name: string) {
		return this.page.getByText(`!${name}`, { exact: true });
	}

	async addTag(tag: string) {
		await this.inputTags.fill(tag);
		await this.btnAddTag.click();
	}

	get btnEdit() {
		return this.page.getByRole('button', { name: 'Edit', exact: true });
	}

	get btnSave(): Locator {
		return this.page.getByRole('button', { name: 'Save', exact: true });
	}

	get btnNew(): Locator {
		return this.page.locator('role=button[name="Create canned response"]').first();
	}
}
