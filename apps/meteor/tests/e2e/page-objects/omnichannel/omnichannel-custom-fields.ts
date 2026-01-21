import type { Locator, Page } from '@playwright/test';

import { OmnichannelAdmin } from './omnichannel-admin';
import { FlexTab } from '../fragments/flextab';
import { Table } from '../fragments/table';

class OmnichannelManageCustomFieldsFlexTab extends FlexTab {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Custom Field' }));
	}

	get inputField(): Locator {
		return this.root.getByRole('textbox', { name: 'Field', exact: true });
	}

	get inputLabel(): Locator {
		return this.root.getByRole('textbox', { name: 'Label', exact: true });
	}

	get labelVisible(): Locator {
		return this.root.getByText('Visible');
	}
}

class OmnichannelCustomFieldsTable extends Table {
	constructor(page: Page) {
		super(page.getByRole('table', { name: 'Custom Fields' }));
	}
}

export class OmnichannelCustomFields extends OmnichannelAdmin {
	readonly manageCustomFields: OmnichannelManageCustomFieldsFlexTab;

	readonly table: OmnichannelCustomFieldsTable;

	constructor(page: Page) {
		super(page);
		this.manageCustomFields = new OmnichannelManageCustomFieldsFlexTab(page);
		this.table = new OmnichannelCustomFieldsTable(page);
	}

	async createNew() {
		await this.getButtonByType('custom field').click();
	}

	async deleteCustomField(fieldName: string) {
		await this.table.findRowByName(fieldName).getByRole('button', { name: 'Remove' }).click();
		await this.deleteModal.confirmDelete();
	}
}
