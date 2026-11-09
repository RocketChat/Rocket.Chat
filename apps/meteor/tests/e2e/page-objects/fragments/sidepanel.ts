import type { Locator, Page } from '@playwright/test';

export class Sidepanel {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get sidepanel(): Locator {
		return this.page.getByRole('tabpanel', { name: 'Side panel' });
	}

	get sidepanelList(): Locator {
		return this.sidepanel.getByRole('list', { name: 'Channels' });
	}

	get firstChannelFromList(): Locator {
		return this.sidepanelList.getByRole('listitem').first();
	}

	get unreadCheckbox(): Locator {
		return this.sidepanel.getByRole('heading').getByRole('checkbox', { name: 'Unread' });
	}

	get unreadToggleLabel(): Locator {
		return this.sidepanel.getByRole('heading').locator('label', { hasText: 'Unread' });
	}

	get sidepanelBackButton(): Locator {
		return this.sidepanel.getByRole('button', { name: 'Back' });
	}

	getSidepanelHeader(name: string): Locator {
		return this.sidepanel.getByRole('heading', { name, exact: true });
	}

	/** The whole row, so tests reach the badges, preview and menu that sit beside the room link. */
	getItemByName(name: string): Locator {
		return this.sidepanelList.getByRole('listitem').filter({ has: this.page.getByRole('link', { name }) });
	}

	getItemLinkByName(name: string): Locator {
		return this.sidepanelList.getByRole('link', { name });
	}

	getItemUnreadBadge(item: Locator): Locator {
		return item.getByRole('status', { name: 'unread' });
	}
}
