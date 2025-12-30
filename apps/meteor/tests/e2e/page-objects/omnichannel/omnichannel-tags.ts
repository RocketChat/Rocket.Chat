import type { Locator, Page } from '@playwright/test';

import { OmnichannelAdmin } from './omnichannel-admin';
import { FlexTab } from '../fragments/flextab';
import { Table } from '../fragments/table';

class OmnichannelEditTagFlexTab extends FlexTab {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Edit tag' }));
	}

	get inputDepartments(): Locator {
		return this.root.locator('input[placeholder="Select an option"]');
	}

	private selectOption(name: string): Locator {
		return this.root.locator('#position-container').getByRole('option', { name });
	}

	async selectDepartment(name: string) {
		await this.inputDepartments.click();
		await this.inputDepartments.fill(name);
		await this.selectOption(name).click();
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

	get btnCreateTag(): Locator {
		return this.createByName('tag');
	}

	async deleteTag(name: string) {
		await this.table.findRowByName(name).getByRole('button', { name: 'Delete' }).click();
		await this.deleteModal.confirmDelete();
	}
}
