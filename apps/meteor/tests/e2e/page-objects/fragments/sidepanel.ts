import type { Locator, Page } from '@playwright/test';

export class Sidepanel {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get sidepanel(): Locator {
		return this.page.getByRole('tabpanel', { name: 'sidepanel' });
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

	getTeamItemByName(name: string): Locator {
		return this.sidepanelList
			.getByRole('link')
			.filter({ hasText: name })
			.filter({ hasNot: this.page.getByRole('button', { name }) });
	}

	getMainRoomByName(name: string): Locator {
		return this.getTeamItemByName(name);
	}

	getItemByName(name: string): Locator {
		return this.sidepanelList.getByRole('link', { name });
	}

	getSidepanelItem(name: string, subtitle?: string): Locator {
		const regex = new RegExp(`${name}.*${subtitle}`);
		return this.sidepanelList.getByRole('link', { name: regex });
	}

	getItemUnreadBadge(item: Locator): Locator {
		return item.getByRole('status', { name: 'unread' });
	}
}
