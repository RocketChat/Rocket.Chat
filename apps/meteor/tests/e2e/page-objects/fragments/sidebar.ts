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
		return this.teamCollabFilters.getByRole('tab', { name: 'All' });
	}

	get favoritesTeamCollabFilter(): Locator {
		return this.teamCollabFilters.getByRole('tab', { name: 'Favorites' });
	}

	get discussionsTeamCollabFilter(): Locator {
		return this.teamCollabFilters.getByRole('tab', { name: 'Discussions' });
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

	getFilterItemByName(name: string): Locator {
		return this.root.getByRole('button', { name }).filter({ has: this.page.getByText(name, { exact: true }) });
	}

	getSidebarListItem(name: string): Locator {
		return this.root.getByRole('listitem').filter({ has: this.page.getByText(name, { exact: true }) });
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
		return this.root.getByRole('button').filter({ has: this.page.getByRole('heading', { name, exact: true }) });
	}

	getItemUnreadBadge(item: Locator): Locator {
		return item.getByRole('status', { name: 'unread' });
	}

	getBadgeIndicator(name: string, title: string): Locator {
		return this.getSidebarItemByName(name).getByTitle(title);
	}

	async selectPriority(name: string, priority: string) {
		const sidebarItem = this.getSidebarItemByName(name);
		await sidebarItem.hover();
		await sidebarItem.focus();
		await sidebarItem.getByRole('button', { name: 'Options', exact: true }).click();
		await this.page.getByRole('menuitem', { name: priority }).click();
	}

	getSidebarListItemByName(name: string): Locator {
		return this.channelsList.getByRole('listitem').filter({ has: this.getSidebarItemByName(name) });
	}

	// --- Custom categories ---

	/** The collapser (region) of an expanded custom category or system group. */
	getCategoryCollapser(name: string): Locator {
		return this.channelsList.getByRole('region', { name: `Collapse ${name}` });
	}

	/** The collapser (region) of a collapsed custom category or system group. */
	getCollapsedCategoryCollapser(name: string): Locator {
		return this.channelsList.getByRole('region', { name: `Expand ${name}` });
	}

	/** The "drag rooms here" placeholder shown inside an empty custom category. */
	get dragRoomsPlaceholder(): Locator {
		return this.channelsList.getByText('Drag rooms here');
	}

	/**
	 * The category kebab is overlaid as a sibling of the collapser region, inside the same (unnamed) wrapper,
	 * so it is reached via the region's parent. It only renders while the collapser is hovered.
	 */
	getCategoryKebab(name: string): Locator {
		return this.getCategoryCollapser(name).locator('xpath=..').getByRole('button', { name: 'Options', exact: true });
	}

	async openCategoryMenu(name: string): Promise<void> {
		await this.getCategoryCollapser(name).hover();
		await this.getCategoryKebab(name).click();
	}

	async openRoomMenu(name: string): Promise<void> {
		const item = this.getSidebarItemByName(name);
		await item.hover();
		await item.focus();
		await item.getByRole('button', { name: 'Options', exact: true }).click();
	}

	/** Move a room into a custom category (or to "Favorites") through the kebab "Move to ▸" submenu. */
	async moveRoomToCategory(roomName: string, categoryName: string): Promise<void> {
		await this.openRoomMenu(roomName);
		await this.page.getByRole('menuitem', { name: 'Move to' }).hover();
		await this.page.getByRole('menuitem', { name: categoryName, exact: true }).click();
	}

	/** Remove a room from its current grouping (back to its system group) through the kebab submenu. */
	async removeRoomFromCategory(roomName: string, categoryName: string): Promise<void> {
		await this.openRoomMenu(roomName);
		await this.page.getByRole('menuitem', { name: 'Move to' }).hover();
		await this.page.getByRole('menuitem', { name: `Remove from ${categoryName}` }).click();
	}

	/** Create a new category seeded with the given room via the kebab submenu "New category". */
	async createCategoryFromRoom(roomName: string): Promise<void> {
		await this.openRoomMenu(roomName);
		await this.page.getByRole('menuitem', { name: 'Move to' }).hover();
		await this.page.getByRole('menuitem', { name: 'New category', exact: true }).click();
	}

	/** Favorite a room through the kebab "Move to ▸ Favorites" item. */
	async moveRoomToFavorites(roomName: string): Promise<void> {
		await this.openRoomMenu(roomName);
		await this.page.getByRole('menuitem', { name: 'Move to' }).hover();
		await this.page.getByRole('menuitem', { name: 'Favorites', exact: true }).click();
	}

	/** Unfavorite a room through the kebab "Move to ▸ Remove from Favorites" item. */
	async removeRoomFromFavorites(roomName: string): Promise<void> {
		await this.openRoomMenu(roomName);
		await this.page.getByRole('menuitem', { name: 'Move to' }).hover();
		await this.page.getByRole('menuitem', { name: 'Remove from Favorites' }).click();
	}

	/** The "Move to ▸" submenu item for a grouping target (a category, "Favorites", or "Remove from …"). */
	roomMenuMoveToItem(name: string | RegExp): Locator {
		return this.page.getByRole('menuitem', { name });
	}

	/** Opens the room kebab and hovers "Move to ▸" so the submenu targets are queryable. */
	async openRoomMoveToSubmenu(roomName: string): Promise<void> {
		await this.openRoomMenu(roomName);
		await this.page.getByRole('menuitem', { name: 'Move to' }).hover();
	}
}

export class AdminSidebar extends Sidebar {
	constructor(page: Page) {
		super(page.getByRole('navigation', { name: 'Administration' }));
	}

	get linkEmoji() {
		return this.root.getByRole('link', { name: 'Emoji' });
	}

	async close(): Promise<void> {
		await this.btnClose.click();
		await this.waitForDismissal();
	}
}

export class AccountSidebar extends Sidebar {
	constructor(page: Page) {
		super(page.getByRole('navigation', { name: 'Account' }));
	}

	get linkSecurity(): Locator {
		return this.root.getByRole('link', { name: 'Security' });
	}

	async close(): Promise<void> {
		await this.btnClose.click();
		await this.waitForDismissal();
	}
}

export class OmnichannelSidebar extends Sidebar {
	constructor(page: Page) {
		super(page.getByRole('navigation', { name: 'Omnichannel' }));
	}

	get linkDepartments(): Locator {
		return this.root.locator('a[href="/omnichannel/departments"]');
	}

	get linkAgents(): Locator {
		return this.root.locator('a[href="/omnichannel/agents"]');
	}

	get linkManagers(): Locator {
		return this.root.locator('a[href="/omnichannel/managers"]');
	}

	get linkCustomFields(): Locator {
		return this.root.locator('a[href="/omnichannel/customfields"]');
	}

	get linkCurrentChats(): Locator {
		return this.root.locator('a[href="/omnichannel/current"]');
	}

	get linkSlaPolicies(): Locator {
		return this.root.locator('a[href="/omnichannel/sla-policies"]');
	}

	get linkPriorities(): Locator {
		return this.root.locator('a[href="/omnichannel/priorities"]');
	}

	get linkMonitors(): Locator {
		return this.root.locator('a[href="/omnichannel/monitors"]');
	}

	get linkBusinessHours(): Locator {
		return this.root.locator('a[href="/omnichannel/businessHours"]');
	}

	get linkAnalytics(): Locator {
		return this.root.locator('a[href="/omnichannel/analytics"]');
	}

	get linkRealTimeMonitoring(): Locator {
		return this.root.locator('a[href="/omnichannel/realtime-monitoring"]');
	}

	get linkReports(): Locator {
		return this.root.locator('a[href="/omnichannel/reports"]');
	}

	get linkCannedResponses(): Locator {
		return this.root.locator('a[href="/omnichannel/canned-responses"]');
	}

	get linkUnits(): Locator {
		return this.root.locator('a[href="/omnichannel/units"]');
	}

	get linkLivechatAppearance(): Locator {
		return this.root.locator('a[href="/omnichannel/appearance"]');
	}

	get linkTags(): Locator {
		return this.root.locator('a[href="/omnichannel/tags"]');
	}
}
