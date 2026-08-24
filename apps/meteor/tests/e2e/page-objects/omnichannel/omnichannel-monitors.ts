import type { Locator, Page } from '@playwright/test';

import { OmnichannelAdmin } from './omnichannel-admin';
import { Listbox } from '../fragments/listbox';

export class OmnichannelMonitors extends OmnichannelAdmin {
	protected readonly route = 'monitors';

	protected readonly title = 'Monitors';

	readonly listbox: Listbox;

	constructor(page: Page) {
		super(page);
		this.listbox = new Listbox(page);
	}

	private get btnAddMonitor(): Locator {
		return this.page.getByRole('button', { name: 'Add monitor' });
	}

	get inputMonitor(): Locator {
		return this.page.locator('input[name="monitor"]');
	}

	private btnRemoveByName(name: string): Locator {
		return this.table.findRowByName(name).getByRole('button', { name: 'Remove' });
	}

	private async selectMonitor(name: string) {
		await this.inputMonitor.fill(name);
		await this.listbox.selectOption(name);
	}

	async removeMonitor(name: string) {
		await this.btnRemoveByName(name).click();
		await this.deleteModal.confirmDelete();
	}

	async addMonitor(name: string) {
		await this.selectMonitor(name);
		await this.btnAddMonitor.click();
	}
}
