import type { Locator, Page } from '@playwright/test';

import { OmnichannelChatsFilters } from './omnichannel-contact-center-chats-filters';

export class OmnichannelChats {
	private readonly page: Page;

	filters: OmnichannelChatsFilters;

	constructor(page: Page) {
		this.page = page;
		this.filters = new OmnichannelChatsFilters(page);
	}

	get btnFilters(): Locator {
		return this.page.locator('role=button[name="Filters"]');
	}

	get inputSearch(): Locator {
		return this.page.locator('role=textbox[name="Search"]');
	}

	findRowByName(contactName: string) {
		return this.page.locator(`td >> text="${contactName}"`);
	}
}
