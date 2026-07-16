import type { Locator, Page } from '@playwright/test';

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

	async goto() {
		await this.page.goto('/directory');
		await this.waitForDirectory();
	}

	private get directoryHeader(): Locator {
		return this.page.locator('main').getByRole('heading', { name: 'Directory', exact: true });
	}

	private async waitForDirectory(): Promise<void> {
		await this.directoryHeader.waitFor();
	}
}
