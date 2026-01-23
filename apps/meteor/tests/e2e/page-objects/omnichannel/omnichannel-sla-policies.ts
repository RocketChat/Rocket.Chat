import type { Locator, Page } from '@playwright/test';

import { OmnichannelAdmin } from './omnichannel-admin';
import { FlexTab } from '../fragments/flextab';
import { Table } from '../fragments/table';

class OmnichannelManageSlaPolicyFlexTab extends FlexTab {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'SLA Policy' }));
	}

	get inputDescription(): Locator {
		return this.root.getByRole('textbox', { name: 'Description' });
	}

	get inputEstimatedWaitTime(): Locator {
		return this.root.locator('[name="dueTimeInMinutes"]');
	}
}

class OmnichannelSlaPoliciesTable extends Table {
	constructor(page: Page) {
		super(page.getByRole('table', { name: 'SLA Policies' }));
	}
}

export class OmnichannelSlaPolicies extends OmnichannelAdmin {
	readonly manageSlaPolicy: OmnichannelManageSlaPolicyFlexTab;

	readonly table: OmnichannelSlaPoliciesTable;

	constructor(page: Page) {
		super(page);
		this.manageSlaPolicy = new OmnichannelManageSlaPolicyFlexTab(page);
		this.table = new OmnichannelSlaPoliciesTable(page);
	}

	btnRemove(name: string) {
		return this.table.findRowByName(name).getByRole('button', { name: 'Remove' });
	}

	async removeSLA(name: string) {
		await this.btnRemove(name).click();
		await this.deleteModal.confirmDelete();
	}

	async createNew() {
		await this.getButtonByType('SLA policy').click();
	}

	get txtEmptyState() {
		return this.page.locator('div >> text="No results found"');
	}
}
