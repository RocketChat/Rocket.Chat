import type { Locator, Page } from 'playwright-core';

export class Listbox {
	readonly root: Locator;

	constructor(page: Page) {
		this.root = page.getByRole('listbox');
	}
}
