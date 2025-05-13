import type { Locator, Page } from '@playwright/test';

export class Sidebar {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	// New navigation locators
	get sidebar(): Locator {
		return this.page.getByRole('navigation', { name: 'sidebar' });
	}

	get channelsList(): Locator {
		return this.sidebar.getByRole('list', { name: 'Channels' });
	}

	getSearchRoomByName(name: string) {
		return this.channelsList.getByRole('link', { name });
	}

	get firstCollapser(): Locator {
		return this.channelsList.getByRole('button').first();
	}

	get firstChannelFromList(): Locator {
		return this.channelsList.getByRole('listitem').first();
	}

	async escSearch(): Promise<void> {
		await this.page.keyboard.press('Escape');
	}

	async markItemAsUnread(item: Locator): Promise<void> {
		await item.hover();
		await item.focus();
		await item.getByRole('button', { name: 'Options', exact: true }).click();
		await this.page.getByRole('menuitem', { name: 'Mark Unread' }).click();
	}

	getCollapseGroupByName(name: string): Locator {
		return this.channelsList.getByRole('button').filter({ has: this.page.getByRole('heading', { name, exact: true }) });
	}

	getItemUnreadBadge(item: Locator): Locator {
		return item.getByRole('status', { name: 'unread' });
	}
}
