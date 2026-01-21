import type { Locator, Page } from 'playwright-core';

export class Listbox {
	readonly root: Locator;

	constructor(page: Page) {
		/**
		 * Currently, our selects and multiSelects has multiple listboxes in the DOM.
		 * So, to avoid selecting the wrong one, we will always select the last until we fix it.
		 */
		this.root = page.getByRole('listbox').last();
	}

	async selectOption(name: string) {
		return this.root.getByRole('option', { name, exact: true }).click();
	}

	public getOption(name: string): Locator {
		return this.root.getByRole('option', { name, exact: true });
	}
}
