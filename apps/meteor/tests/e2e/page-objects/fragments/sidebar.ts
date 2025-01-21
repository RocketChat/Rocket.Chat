import type { Locator, Page } from '@playwright/test';

import { expect } from '../../utils/test';

export class Sidebar {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	// New navigation locators
	get sidebar(): Locator {
		return this.page.getByRole('navigation', { name: 'sidebar' });
	}

	get sidebarSearchSection(): Locator {
		return this.sidebar.getByRole('search');
	}

	get btnRecent(): Locator {
		return this.sidebarSearchSection.getByRole('button', { name: 'Recent' });
	}

	get channelsList(): Locator {
		return this.sidebar.getByRole('list', { name: 'Channels' });
	}

	get searchList(): Locator {
		return this.sidebar.getByRole('search').getByRole('list', { name: 'Channels' });
	}

	get firstCollapser(): Locator {
		return this.channelsList.getByRole('button').first();
	}

	get firstChannelFromList(): Locator {
		return this.channelsList.getByRole('listitem').first();
	}

	get searchInput(): Locator {
		return this.sidebarSearchSection.getByRole('searchbox');
	}

	async setDisplayMode(mode: 'Extended' | 'Medium' | 'Condensed'): Promise<void> {
		await this.sidebarSearchSection.getByRole('button', { name: 'Display', exact: true }).click();
		await this.sidebarSearchSection.getByRole('menuitemcheckbox', { name: mode }).click();
		await this.sidebarSearchSection.click();
	}

	async escSearch(): Promise<void> {
		await this.page.keyboard.press('Escape');
	}

	async waitForChannel(): Promise<void> {
		await this.page.locator('role=main').waitFor();
		await this.page.locator('role=main >> role=heading[level=1]').waitFor();
		const messageList = this.page.getByRole('main').getByRole('list', { name: 'Message list', exact: true });
		await messageList.waitFor();

		await expect(messageList).not.toHaveAttribute('aria-busy', 'true');
	}

	async typeSearch(name: string): Promise<void> {
		return this.searchInput.fill(name);
	}

	getSearchRoomByName(name: string): Locator {
		return this.searchList.getByRole('link', { name });
	}

	async openChat(name: string): Promise<void> {
		await this.typeSearch(name);
		await this.getSearchRoomByName(name).click();
		await this.waitForChannel();
	}

	async markItemAsUnread(item: Locator): Promise<void> {
		await item.hover();
		await item.focus();
		await item.locator('.rcx-sidebar-item__menu').click();
		await this.page.getByRole('menuitem', { name: 'Mark Unread' }).click();
	}

	getCollapseGroupByName(name: string): Locator {
		return this.channelsList.getByRole('button').filter({ has: this.page.getByRole('heading', { name, exact: true }) });
	}

	getItemUnreadBadge(item: Locator): Locator {
		return item.getByRole('status', { name: 'unread' });
	}
}
