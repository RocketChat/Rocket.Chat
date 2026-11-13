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

	/**
	 * Waits until the rows on screen are current, for tables that set `aria-busy` while loading.
	 * @param fallback as in {@link waitForDisplay}.
	 */
	waitForSettled(fallback?: Locator) {
		const settled = this.root.and(this.root.page().locator('[aria-busy="false"]'));
		return expect(fallback ? settled.or(fallback) : settled).toBeVisible();
	}
}

export class DevicesTable extends Table {
	constructor(page: Page) {
		super(page.getByRole('table', { name: 'Devices' }));
	}

	getRowsForUsername(username: string): Locator {
		return this.root.getByRole('row').getByRole('cell', { name: username, exact: true });
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
