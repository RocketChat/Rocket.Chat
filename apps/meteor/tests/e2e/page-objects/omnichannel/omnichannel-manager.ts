import type { Locator } from '@playwright/test';

import { OmnichannelAdmin } from './omnichannel-admin';

export class OmnichannelManager extends OmnichannelAdmin {
	get inputUsername(): Locator {
		return this.page.getByRole('main').getByLabel('Username');
	}

	async selectUsername(username: string) {
		await this.inputUsername.fill(username);
		await this.page.locator(`role=option[name="${username}"]`).click();
	}

	get btnAdd(): Locator {
		return this.page.locator('button.rcx-button--primary.rcx-button >> text="Add manager"');
	}

	findRowByName(name: string) {
		return this.page.locator('role=table[name="Managers"] >> role=row', { has: this.page.locator(`role=cell[name="${name}"]`) });
	}

	btnDeleteSelectedAgent(text: string) {
		return this.page.locator('tr', { has: this.page.locator(`td >> text="${text}"`) }).locator('button[title="Remove"]');
	}
}
