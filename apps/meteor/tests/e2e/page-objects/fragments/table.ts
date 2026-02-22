import type { Locator, Page } from '@playwright/test';

import { expect } from '../../utils/test';

export abstract class Table {
	constructor(protected root: Locator) {}

	waitForDisplay() {
		return expect(this.root).toBeVisible();
	}

	findRowByName(name: string): Locator {
		return this.root.getByRole('row').filter({
			has: this.root.page().getByText(name, { exact: true }),
		});
	}
}

export class DevicesTable extends Table {
	constructor(page: Page) {
		super(page.getByRole('table', { name: 'Devices' }));
	}

	getDeviceRowById(deviceId: string): Locator {
		return this.findRowByName(deviceId);
	}

	getColumnHeaderByName(name: string): Locator {
		return this.root.getByRole('cell', { name, exact: true });
	}

	async orderByLastLogin() {
		await this.getColumnHeaderByName('Last login').click();
	}
}
