import type { Locator, Page } from '@playwright/test';

export class Sidepanel {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get sidepanelList(): Locator {
		return this.page.getByRole('main').getByRole('list', { name: 'Channels' });
	}

	get firstChannelFromList(): Locator {
		return this.sidepanelList.getByRole('listitem').first();
	}

	getItemByName(name: string): Locator {
		return this.sidepanelList.getByRole('link').filter({ hasText: name });
	}

	getExtendedItem(name: string, subtitle?: string): Locator {
		const regex = new RegExp(`${name}.*${subtitle}`);
		return this.sidepanelList.getByRole('link', { name: regex });
	}

	getItemUnreadBadge(item: Locator): Locator {
		return item.getByRole('status', { name: 'unread' });
	}
}
