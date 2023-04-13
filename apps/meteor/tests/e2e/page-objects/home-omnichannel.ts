import type { Locator, Page } from '@playwright/test';

import { HomeOmnichannelContent, HomeSidenav, HomeFlextab, OmnichannelSidenav } from './fragments';
import { OmnichannelTriggers } from './omnichannel-triggers';

export class HomeOmnichannel {
	private readonly page: Page;

	readonly content: HomeOmnichannelContent;

	readonly sidenav: HomeSidenav;

	readonly tabs: HomeFlextab;

	readonly triggers: OmnichannelTriggers;

	readonly omnisidenav: OmnichannelSidenav;

	constructor(page: Page) {
		this.page = page;
		this.content = new HomeOmnichannelContent(page);
		this.sidenav = new HomeSidenav(page);
		this.tabs = new HomeFlextab(page);
		this.triggers = new OmnichannelTriggers(page);
		this.omnisidenav = new OmnichannelSidenav(page);
	}

	get toastSuccess(): Locator {
		return this.page.locator('.rcx-toastbar.rcx-toastbar--success');
	}

	get btnVerticalBarClose(): Locator {
		return this.page.locator('[data-qa="VerticalBarActionClose"]');
	}

	get btnCurrentChats(): Locator {
		return this.page.locator('[data-qa-id="ToolBoxAction-clock"]');
	}

	get historyItem(): Locator {
		return this.page.locator('[data-qa="chat-history-item"]').first();
	}

	get historyMessage(): Locator {
		return this.page.locator('[data-qa="chat-history-message"]').first();
	}
}
