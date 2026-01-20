import type { Locator, Page } from '@playwright/test';

import { OmnichannelAdmin } from './omnichannel-admin';
import { FlexTab } from '../fragments/flextab';

class OmnichannelManageSlaPolicyFlexTab extends FlexTab {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'SLA Policy' }));
	}

	get inputDescription(): Locator {
		return this.root.locator('[name="description"]');
	}

	get inputEstimatedWaitTime(): Locator {
		return this.root.locator('[name="dueTimeInMinutes"]');
	}

	errorMessage(message: string): Locator {
		return this.root.locator(`.rcx-field__error >> text="${message}"`);
	}
}

export class OmnichannelSlaPolicies extends OmnichannelAdmin {
	readonly manageSlaPolicy: OmnichannelManageSlaPolicyFlexTab;

	constructor(page: Page) {
		super(page);
		this.manageSlaPolicy = new OmnichannelManageSlaPolicyFlexTab(page);
	}

	findRowByName(name: string) {
		return this.page.locator('tr', { has: this.page.locator(`td >> text="${name}"`) });
	}

	btnRemove(name: string) {
		return this.findRowByName(name).locator('button[title="Remove"]');
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
