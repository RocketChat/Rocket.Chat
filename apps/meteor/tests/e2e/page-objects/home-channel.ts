import { Page } from '@playwright/test';

import { HomeContent, HomeSidebar, HomeTabs } from './slices';

export class HomeChannel {
	private readonly page: Page;

	readonly content: HomeContent;

	readonly sidebar: HomeSidebar;

	readonly tabs: HomeTabs;

	constructor(page: Page) {
		this.page = page;

		this.content = new HomeContent(page);
		this.sidebar = new HomeSidebar(page);
		this.tabs = new HomeTabs(page);
	}
}
