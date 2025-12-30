import type { Locator, Page } from '@playwright/test';

import { OmnichannelAdmin } from './omnichannel-admin';
import { Table } from '../fragments/table';

class OmnichannelMonitorsTable extends Table {
	constructor(page: Page) {
		super(page.getByRole('table', { name: 'Monitors' }));
	}
}

export class OmnichannelMonitors extends OmnichannelAdmin {
	readonly table: OmnichannelMonitorsTable;

	constructor(page: Page) {
		super(page);
		this.table = new OmnichannelMonitorsTable(page);
	}

	get btnAddMonitor(): Locator {
		return this.createByName('Add monitor');
	}

	get inputMonitor(): Locator {
		return this.page.locator('input[name="monitor"]');
	}

	btnRemoveByName(name: string): Locator {
		return this.table.findRowByName(name).locator('role=button[name="Remove"]');
	}

	async selectMonitor(name: string) {
		await this.inputMonitor.fill(name);
		await this.page.locator(`li[role="option"]`, { has: this.page.locator(`[data-username='${name}']`) }).click();
	}

	async removeMonitor(name: string) {
		await this.btnRemoveByName(name).click();
		await this.deleteModal.confirmDelete();
	}
}
