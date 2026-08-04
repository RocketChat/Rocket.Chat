import type { Locator, Page } from '@playwright/test';

import { OmnichannelAdmin } from './omnichannel-admin';
import { FlexTab } from '../fragments/flextabs/flextab';

class OmnichannelManageSlaPolicyFlexTab extends FlexTab {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'SLA Policy' }));
	}

	get inputDescription(): Locator {
		return this.root.getByRole('textbox', { name: 'Description' });
	}

	get inputEstimatedWaitTime(): Locator {
		return this.root.getByRole('spinbutton', { name: 'Estimated wait time (time in minutes)', exact: true });
	}
}

export class OmnichannelSlaPolicies extends OmnichannelAdmin {
	protected readonly route = 'sla-policies';

	protected readonly title = 'SLA Policies';

	readonly manageSlaPolicy: OmnichannelManageSlaPolicyFlexTab;

	constructor(page: Page) {
		super(page);
		this.manageSlaPolicy = new OmnichannelManageSlaPolicyFlexTab(page);
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
}
