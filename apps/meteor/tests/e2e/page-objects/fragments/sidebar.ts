import type { Locator, Page } from '@playwright/test';

import { expect } from '../../utils/test';

export abstract class Sidebar {
	constructor(protected root: Locator) {}

	get btnClose(): Locator {
		return this.root.getByRole('button', { name: 'Close' });
	}

	waitForDismissal() {
		return expect(this.root).not.toBeVisible();
	}

	waitForDisplay() {
		return expect(this.root).toBeVisible();
	}
}

export class RoomSidebar extends Sidebar {
	constructor(protected page: Page) {
		super(page.getByRole('navigation', { name: 'Sidebar' }));
	}

	get teamCollabFilters(): Locator {
		return this.root.getByRole('tablist', { name: 'Team collaboration filters' });
	}

	get omnichannelFilters(): Locator {
		return this.root.getByRole('tablist', { name: 'Omnichannel filters' });
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
		return this.root.getByTestId('virtuoso-top-item-list');
	}

	get channelsList(): Locator {
		// TODO: fix this filter, workaround due to virtuoso
		// return this.sidebar.getByRole('list', { name: 'Channels' }).filter({ has: this.page.getByRole('listitem') });
		return this.root.getByTestId('virtuoso-item-list');
	}

	getSidebarItemByName(name: string) {
		return this.channelsList.getByRole('link', { name }).filter({ has: this.page.getByText(name, { exact: true }) });
	}

	// Note: this is different from openChat because queued chats are not searchable
	getQueuedChat(name: string): Locator {
		return this.page.locator('[data-qa="sidebar-item-title"]', { hasText: new RegExp(`^${name}$`) }).first();
	}

	get firstCollapser(): Locator {
		return this.topChannelList.getByRole('region').first();
	}

	get teamsCollapser(): Locator {
		return this.root.getByRole('region', { name: 'Collapse Teams' }).first();
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

export class AdminSidebar extends Sidebar {
	constructor(page: Page) {
		super(page.getByRole('navigation', { name: 'Administration' }));
	}

	async close(): Promise<void> {
		await this.btnClose.click();
		await this.waitForDismissal();
	}
}


export class ProfileSidebar extends Sidebar {
	constructor(page: Page) {
		super(page.getByRole('navigation').filter({ hasText: 'Account' }));
	}

	get linkSecurity(): Locator {
		return this.root.getByRole('link', { name: 'Security' });
	}
}
