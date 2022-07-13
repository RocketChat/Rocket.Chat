import { Page } from '@playwright/test';

import { HomeContent, HomeSidenav, HomeFlextab } from './fragments';

export class HomeChannel {
	readonly content: HomeContent;

	readonly sidenav: HomeSidenav;

	readonly tabs: HomeFlextab;

	constructor(page: Page) {
		this.content = new HomeContent(page);
		this.sidenav = new HomeSidenav(page);
		this.tabs = new HomeFlextab(page);
	}
}
