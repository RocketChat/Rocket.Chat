import type { Locator } from '@playwright/test';

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
