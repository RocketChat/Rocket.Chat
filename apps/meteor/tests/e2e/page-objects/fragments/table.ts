import type { Locator, Page } from '@playwright/test';

import { expect } from '../../utils/test';

export class Table {
	constructor(protected root: Locator) {}

	/**
	 * @param fallback also satisfies the wait, for tables the page may legitimately
	 * replace with something else — an empty state, most commonly.
	 */
	waitForDisplay(fallback?: Locator) {
		return expect(fallback ? this.root.or(fallback) : this.root).toBeVisible();
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

	async countRowsForUsername(username: string): Promise<number> {
		return this.root.getByRole('row').getByRole('cell', { name: username, exact: true }).count();
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
