import type { Locator, Page } from '@playwright/test';

import { MenuOptions, MenuMoveTo } from './menu';
import { DeleteCategoryModal, ManageCategoryModal, CreateNewCategoryModal } from './modals';
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
	readonly menuOptions: MenuOptions;

	readonly menuMoveTo: MenuMoveTo;

	readonly modals: {
		deleteCategory: DeleteCategoryModal;
		manageCategory: ManageCategoryModal;
		createCategory: CreateNewCategoryModal;
	};

	constructor(protected page: Page) {
		super(page.getByRole('navigation', { name: 'Sidebar' }));
		this.modals = {
			deleteCategory: new DeleteCategoryModal(page),
			manageCategory: new ManageCategoryModal(page),
			createCategory: new CreateNewCategoryModal(page),
		};
		this.menuOptions = new MenuOptions(page);
		this.menuMoveTo = new MenuMoveTo(page);
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
		return this.topChannelList.getByRole('region').first().getByRole('button').first();
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

	getCategoryCollapser(name: string): Locator {
		return this.root.getByRole('region', { name: `Collapse ${name}`, exact: true }).first();
	}

	getCategoryKebab(name: string): Locator {
		return this.getCategoryCollapser(name).getByRole('button', { name: 'Options', exact: true });
	}

	async openCategoryMenu(name: string): Promise<void> {
		await this.getCategoryCollapser(name).hover();
		await this.getCategoryKebab(name).click();
	}

	async renameCategory(name: string, newName: string): Promise<void> {
		await this.openCategoryMenu(name);
		await this.page.getByRole('menuitemcheckbox', { name: 'Manage', exact: true }).click();
		await this.modals.manageCategory.rename(newName);
	}

	async deleteCategory(name: string): Promise<void> {
		await this.openCategoryMenu(name);
		await this.page.getByRole('menuitemcheckbox', { name: 'Delete', exact: true }).click();
		await this.modals.deleteCategory.delete();
	}

	get moveToOption(): Locator {
		return this.page.getByRole('menuitem', { name: 'Move to', exact: true });
	}

	async openRoomMenu(name: string): Promise<void> {
		const item = this.getSidebarItemByName(name);
		await item.hover();
		await item.focus();
		await item.getByRole('button', { name: 'Options', exact: true }).click();
		await this.menuOptions.waitForDisplay();
	}

	/** The open submenu keeps the first Escape, so the kebab menu itself needs a second one. */
	async closeRoomMenu(): Promise<void> {
		await this.page.keyboard.press('Escape');
		await this.page.keyboard.press('Escape');
		await expect(this.moveToOption).toBeHidden();
	}

	/** Move a room into a custom category (or to "Favorites") through the kebab "Move to ▸" submenu. */
	async moveRoomToCategory(roomName: string, categoryName: string): Promise<void> {
		await this.openRoomMoveToSubmenu(roomName);
		await this.menuMoveTo.selectMenuItem(categoryName);
	}

	async removeRoomFromCategory(roomName: string, categoryName: string): Promise<void> {
		await this.openRoomMoveToSubmenu(roomName);
		await this.menuMoveTo.selectMenuItem(`Remove from ${categoryName}`);
	}

	async createCategoryFromRoom(roomName: string, name: string): Promise<void> {
		await this.openRoomMoveToSubmenu(roomName);
		await this.menuMoveTo.selectMenuItem('New category');
		await this.modals.createCategory.inputName.fill(name);
		await this.modals.createCategory.create(true);
	}

	async moveRoomToFavorites(roomName: string): Promise<void> {
		await this.openRoomMoveToSubmenu(roomName);
		await this.menuMoveTo.selectMenuItem('Favorites');
	}

	async removeRoomFromFavorites(roomName: string): Promise<void> {
		await this.openRoomMoveToSubmenu(roomName);
		await this.menuMoveTo.selectMenuItem('Remove from Favorites');
	}

	async openRoomMoveToSubmenu(roomName: string): Promise<void> {
		await this.openRoomMenu(roomName);
		await this.menuOptions.selectMenuItem('Move to', true);
		await this.menuMoveTo.waitForDisplay();
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

	getSidebarLinkByName(name: string): Locator {
		return this.root.getByRole('link', { name, exact: true });
	}
}
