import type { Locator, Page } from '@playwright/test';

import { HomeContent, HomeSidenav, OmnichannelContextualBar } from './fragments';

export class HomeLivechat {
	private readonly page: Page;

	readonly content: HomeContent;

	readonly sidenav: HomeSidenav;

	readonly contextualBar: OmnichannelContextualBar;

	constructor(page: Page) {
		this.page = page;
		this.content = new HomeContent(page);
		this.sidenav = new HomeSidenav(page);
		this.contextualBar = new OmnichannelContextualBar(page);
	}

	get inputChannelName(): Locator {
		return this.page.locator('.rcx-input-box--undecorated.rcx-input-box').first();
	}

	get inputName(): Locator {
		return this.page.locator('[placeholder="A meaningful name for the discussion room"]');
	}

	get inputMessage(): Locator {
		return this.page.locator('textarea.rcx-input-box');
	}

	get btnCreate(): Locator {
		return this.page.locator('button.rcx-button--primary.rcx-button >> text="Create"');
	}
}
