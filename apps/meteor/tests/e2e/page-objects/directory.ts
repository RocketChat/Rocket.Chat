import type { Page } from '@playwright/test';

export class Directory {
	public readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	async searchChannel(name: string) {
		await this.page.getByRole('textbox', { name: 'Search' }).fill(name);
	}

	getSearchByChannelName(name: string) {
		return this.page.locator(`role=table >> role=link >> text="${name}"`);
	}

	async openChannel(name: string) {
		await this.searchChannel(name);
		await this.getSearchByChannelName(name).click();
	}
}
