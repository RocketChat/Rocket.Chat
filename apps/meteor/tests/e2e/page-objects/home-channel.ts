import { Page } from '@playwright/test';

import { HomeContent, HomeSidenav, HomeFlextab } from './fragments';

export class HomeChannel {
	private readonly page: Page;

	readonly content: HomeContent;

	readonly sidenav: HomeSidenav;

	readonly tabs: HomeFlextab;

	constructor(page: Page) {
		this.page = page;
		this.content = new HomeContent(page);
		this.sidenav = new HomeSidenav(page);
		this.tabs = new HomeFlextab(page);
	}

	async doDismissToast(): Promise<void> {
		if (await this.page.locator('.rcx-toastbar').isVisible()) {
			await this.page.locator('.rcx-toastbar').locator('button').click();
		}
	}
}
