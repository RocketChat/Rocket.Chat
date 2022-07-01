import { Page } from '@playwright/test';

import { OmnichannelSidebar } from './slices';

export class OmnichannelAgents {
	private readonly page: Page;

	readonly sidebar: OmnichannelSidebar;

	constructor(page: Page) {
		this.page = page;

		this.sidebar = new OmnichannelSidebar(page);
	}
}
