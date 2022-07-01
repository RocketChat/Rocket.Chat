import { Page } from '@playwright/test';

import { HomeContent, HomeSidebar, HomeFlexTabs } from './slices';

export class HomeDirect {
	private readonly page: Page;

	readonly content: HomeContent;

	readonly sidebar: HomeSidebar;

	readonly tabs: HomeFlexTabs;

	constructor(page: Page) {
		this.page = page;

		this.content = new HomeContent(page);
		this.sidebar = new HomeSidebar(page);
		this.tabs = new HomeFlexTabs(page);
	}
}
