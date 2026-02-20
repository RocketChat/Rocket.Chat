import type { Locator, Page } from 'playwright-core';

export class Listbox {
	readonly root: Locator;

	constructor(page: Page, name?: string) {
		/**
		 * Currently, our selects and multiSelects has multiple listboxes in the DOM.
		 * So, to avoid selecting the wrong one, we will always select the last until we fix it.
		 */
		this.root = page.getByRole('listbox', { name }).last();
	}

	async selectOption(name: string, exact?: boolean) {
		return this.root.getByRole('option', { name, exact }).click();
	}

	public getOption(name: string): Locator {
		return this.root.getByRole('option', { name, exact: true });
	}
}
