import type { Locator, Page } from '@playwright/test';

import { OmnichannelAdmin } from './omnichannel-admin';
import { FlexTab } from '../fragments/flextabs/flextab';

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

export class OmnichannelCustomFields extends OmnichannelAdmin {
	protected readonly route = 'customfields';

	protected readonly title = 'Custom Fields';

	readonly manageCustomFields: OmnichannelManageCustomFieldsFlexTab;

	constructor(page: Page) {
		super(page);
		this.manageCustomFields = new OmnichannelManageCustomFieldsFlexTab(page);
	}

	async createNew() {
		await this.getButtonByType('custom field').click();
	}

	async deleteCustomField(fieldName: string) {
		await this.table.findRowByName(fieldName).getByRole('button', { name: 'Remove' }).click();
		await this.deleteModal.confirmDelete();
	}
}
