import type { Locator } from '@playwright/test';

import { OmnichannelAdmin } from './omnichannel-admin';

export class OmnichannelMonitors extends OmnichannelAdmin {
	get btnAddMonitor(): Locator {
		return this.createByName('Add monitor');
	}

	get inputMonitor(): Locator {
		return this.page.locator('input[name="monitor"]');
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
