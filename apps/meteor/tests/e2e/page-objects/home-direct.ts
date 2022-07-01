import { Page } from '@playwright/test';

import { HomeContent, HomeSidebar, HomeFlextab } from './slices';

export class HomeDirect {
	private readonly page: Page;

	readonly content: HomeContent;

	readonly sidebar: HomeSidebar;

	readonly tabs: HomeFlextab;

	constructor(page: Page) {
		this.page = page;

		this.content = new HomeContent(page);
		this.sidebar = new HomeSidebar(page);
		this.tabs = new HomeFlextab(page);
	}
}
