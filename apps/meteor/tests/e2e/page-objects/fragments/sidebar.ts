import type { Locator, Page } from '@playwright/test';

export class Sidebar {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	// New navigation locators
	get sidebar(): Locator {
		return this.page.getByRole('navigation', { name: 'Sidebar' });
	}

	get teamCollabFilters(): Locator {
		return this.sidebar.getByRole('tablist', { name: 'Team collaboration filters' });
	}

	get omnichannelFilters(): Locator {
		return this.sidebar.getByRole('tablist', { name: 'Omnichannel filters' });
	}

	get allTeamCollabFilter(): Locator {
		return this.teamCollabFilters.getByRole('button', { name: 'All' });
	}

	get favoritesTeamCollabFilter(): Locator {
		return this.teamCollabFilters.getByRole('button', { name: 'Favorites' });
	}

	get discussionsTeamCollabFilter(): Locator {
		return this.teamCollabFilters.getByRole('button', { name: 'Discussions' });
	}

	// TODO: fix this filter, workaround due to virtuoso
	get topChannelList(): Locator {
		return this.sidebar.getByTestId('virtuoso-top-item-list');
	}

	get channelsList(): Locator {
		// TODO: fix this filter, workaround due to virtuoso
		// return this.sidebar.getByRole('list', { name: 'Channels' }).filter({ has: this.page.getByRole('listitem') });
		return this.sidebar.getByTestId('virtuoso-item-list');
	}

	getSearchRoomByName(name: string) {
		return this.channelsList.getByRole('button', { name, exact: true });
	}

	get firstCollapser(): Locator {
		return this.topChannelList.getByRole('region').first();
	}

	get teamsCollapser(): Locator {
		return this.sidebar.getByRole('region', { name: 'Collapse Teams' }).first();
	}

	get channelsCollapser(): Locator {
		return this.channelsList.getByRole('region', { name: 'Collapse Channels' });
	}

	get directMessagesCollapser(): Locator {
		return this.channelsList.getByRole('region', { name: 'Collapse Direct messages' });
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
