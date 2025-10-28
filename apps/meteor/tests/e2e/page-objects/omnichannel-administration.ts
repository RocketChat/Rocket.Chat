import type { Page } from '@playwright/test';

import { OmnichannelSidenav } from './fragments';

export class OmnichannelAdministration {
	protected readonly page: Page;

	readonly sidenav: OmnichannelSidenav;

	constructor(page: Page) {
		this.page = page;
		this.sidenav = new OmnichannelSidenav(page);
	}
}
