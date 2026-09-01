import type { Locator, Page } from '@playwright/test';

import { OmnichannelAdmin } from './omnichannel-admin';
import { Listbox } from '../fragments/listbox';

export class OmnichannelManager extends OmnichannelAdmin {
	protected readonly route = 'managers';

	protected readonly title = 'Managers';

	readonly listbox: Listbox;

	constructor(page: Page) {
		super(page);
		this.listbox = new Listbox(page);
	}

	get inputUsername(): Locator {
		return this.page.getByRole('main').getByLabel('Username');
	}

	async selectUsername(username: string) {
		await this.inputUsername.fill(username);
		await this.listbox.selectOption(username);
	}

	get btnAddManager(): Locator {
		return this.page.getByRole('button', { name: 'Add manager' });
	}

	async removeManager(name: string) {
		await this.table.findRowByName(name).getByRole('button', { name: 'Remove' }).click();
		await this.deleteModal.confirmDelete();
	}
}
