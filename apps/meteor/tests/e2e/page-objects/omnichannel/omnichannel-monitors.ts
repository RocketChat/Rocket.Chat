import type { Locator, Page } from '@playwright/test';

import { OmnichannelAdmin } from './omnichannel-admin';
import { Listbox } from '../fragments/listbox';
import { Table } from '../fragments/table';

class OmnichannelMonitorsTable extends Table {
	constructor(page: Page) {
		super(page.getByRole('table', { name: 'Monitors' }));
	}
}

export class OmnichannelMonitors extends OmnichannelAdmin {
	readonly table: OmnichannelMonitorsTable;

	readonly listbox: Listbox;

	constructor(page: Page) {
		super(page);
		this.table = new OmnichannelMonitorsTable(page);
		this.listbox = new Listbox(page.getByRole('listbox'));
	}

	private get btnAddMonitor(): Locator {
		return this.page.getByRole('button', { name: 'Add monitor' });
	}

	get inputMonitor(): Locator {
		return this.page.locator('input[name="monitor"]');
	}

	btnRemoveByName(name: string): Locator {
		return this.table.findRowByName(name).locator('role=button[name="Remove"]');
	}

	private async selectMonitor(name: string) {
		await this.inputMonitor.fill(name);
		await this.listbox.selectOption(name);
	}

	async removeMonitor(name: string) {
		await this.btnRemoveByName(name).click();
		await this.deleteModal.confirmDelete();
	}

	async addMonitor(name: string) {
		await this.selectMonitor(name);
		await this.btnAddMonitor.click();
	}
}
