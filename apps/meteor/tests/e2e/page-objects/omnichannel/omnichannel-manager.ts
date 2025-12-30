import type { Locator, Page } from '@playwright/test';

import { OmnichannelAdmin } from './omnichannel-admin';
import { Table } from '../fragments/table';

class OmnichannelManagersTable extends Table {
	constructor(page: Page) {
		super(page.getByRole('table', { name: 'Managers' }));
	}
}

export class OmnichannelManager extends OmnichannelAdmin {
	readonly table: OmnichannelManagersTable;

	constructor(page: Page) {
		super(page);
		this.table = new OmnichannelManagersTable(page);
	}

	get inputUsername(): Locator {
		return this.page.getByRole('main').getByLabel('Username');
	}

	async selectUsername(username: string) {
		await this.inputUsername.fill(username);
		await this.page.locator(`role=option[name="${username}"]`).click();
	}

	get btnAdd(): Locator {
		return this.page.locator('button.rcx-button--primary.rcx-button >> text="Add manager"');
	}

	async removeManager(name: string) {
		await this.table.findRowByName(name).getByRole('button', { name: 'Remove' }).click();
		await this.deleteModal.confirmDelete();
	}
}
