import type { Locator, Page } from '@playwright/test';

import { OmnichannelAdmin } from './omnichannel-admin';
import { FlexTab } from '../fragments/flextabs/flextab';
import { Listbox } from '../fragments/listbox';

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

	findSelectedDepartment(name: string) {
		return this.root.getByLabel('Departments').getByRole('option', { name });
	}
}

export class OmnichannelTags extends OmnichannelAdmin {
	protected readonly route = 'tags';

	protected readonly title = 'Tags';

	readonly editTag: OmnichannelEditTagFlexTab;

	constructor(page: Page) {
		super(page);
		this.editTag = new OmnichannelEditTagFlexTab(page);
	}

	async createNew() {
		await this.getButtonByType('tag').click();
	}

	async deleteTag(name: string) {
		await this.table.findRowByName(name).getByRole('button', { name: 'Remove' }).click();
		await this.deleteModal.confirmDelete();
	}
}
