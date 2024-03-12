import type { Locator, Page } from '@playwright/test';

import { HomeContent, HomeSidenav, HomeFlextab } from './fragments';

export class HomeDiscussion {
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

	get inputChannelName(): Locator {
		return this.page.locator('role=textbox[name="Parent channel or team"]');
	}

	get inputName(): Locator {
		return this.page.locator('role=textbox[name="Discussion name"]');
	}

	get inputMessage(): Locator {
		return this.page.locator('role=textbox[name="Message"]');
	}

	get btnCreate(): Locator {
		return this.page.locator('role=button[name="Create"]');
	}
}
