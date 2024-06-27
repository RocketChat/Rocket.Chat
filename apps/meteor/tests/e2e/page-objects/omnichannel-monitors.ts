import type { Locator } from '@playwright/test';

import { OmnichannelAdministration } from './omnichannel-administration';

export class OmnichannelMonitors extends OmnichannelAdministration {
	get modalConfirmRemove(): Locator {
		return this.page.locator('[data-qa-id="manage-monitors-confirm-remove"]');
	}

	get btnConfirmRemove(): Locator {
		return this.modalConfirmRemove.locator('role=button[name="Delete"]');
	}

	get btnAddMonitor(): Locator {
		return this.page.locator('role=button[name="Add monitor"]');
	}

	get inputMonitor(): Locator {
		return this.page.locator('input[name="monitor"]');
	}

	get inputSearch(): Locator {
		return this.page.getByRole('main').getByRole('textbox', { name: 'Search' });
	}

	findRowByName(name: string): Locator {
		return this.page.locator(`tr[data-qa-id="${name}"]`);
	}

	btnRemoveByName(name: string): Locator {
		return this.findRowByName(name).locator('role=button[name="Remove"]');
	}

	async selectMonitor(name: string) {
		await this.inputMonitor.fill(name);
		await this.page.locator(`li[role="option"]`, { has: this.page.locator(`[data-username='${name}']`) }).click();
	}
}
