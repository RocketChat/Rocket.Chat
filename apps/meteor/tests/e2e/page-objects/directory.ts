import type { Locator } from '@playwright/test';

import { RoutedPage } from './routed-page';

export class Directory extends RoutedPage {
	protected readonly route = '/directory';

	async waitForReady(): Promise<void> {
		await this.directoryHeader.waitFor({ state: 'visible' });
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

	private get directoryHeader(): Locator {
		return this.page.locator('main').getByRole('heading', { name: 'Directory', exact: true });
	}
}
