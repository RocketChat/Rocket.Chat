import type { Locator, Page } from '@playwright/test';

import { OmnichannelAdmin } from './omnichannel-admin';
import { FlexTab } from '../fragments/flextab';
import { Listbox } from '../fragments/listbox';
import { Table } from '../fragments/table';

class OmnichannelEditTagFlexTab extends FlexTab {
	readonly listbox: Listbox;

	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'tag' }));
		this.listbox = new Listbox(page);
	}

	get inputDepartments(): Locator {
		return this.root.getByLabel('Departments').getByRole('textbox');
	}

	async selectDepartment(name: string) {
		await this.inputDepartments.click();
		await this.inputDepartments.fill(name);
		await this.listbox.selectOption(name);
	}
}

class OmnichannelTagsTable extends Table {
	constructor(page: Page) {
		super(page.getByRole('table', { name: 'Tags' }));
	}
}

export class OmnichannelTags extends OmnichannelAdmin {
	readonly editTag: OmnichannelEditTagFlexTab;

	readonly table: OmnichannelTagsTable;

	constructor(page: Page) {
		super(page);
		this.editTag = new OmnichannelEditTagFlexTab(page);
		this.table = new OmnichannelTagsTable(page);
	}

	async createNew() {
		await this.getButtonByType('tag').click();
	}

	async deleteTag(name: string) {
		await this.table.findRowByName(name).getByRole('button', { name: 'Remove' }).click();
		await this.deleteModal.confirmDelete();
	}
}
