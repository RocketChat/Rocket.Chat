import type { Locator } from 'playwright-core';

export class Listbox {
	constructor(private root: Locator) {}

	async selectOption(name: string) {
		return this.root.getByRole('option', { name }).click();
	}

	public getOption(name: string): Locator {
		return this.root.getByRole('option', { name });
	}
}
