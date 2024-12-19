import type { Locator, Page } from '@playwright/test';

import { expect } from '../../utils/test';

export class HomeSidenav {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	/**
	 * @deprecated Use new-room-modal fragment
	 */
	get advancedSettingsAccordion(): Locator {
		return this.page.getByRole('dialog').getByRole('button', { name: 'Advanced settings', exact: true });
	}

	/**
	 * @deprecated Use new-room-modal fragment
	 */
	get checkboxPrivateChannel(): Locator {
		return this.page.locator('label', { has: this.page.getByRole('checkbox', { name: 'Private' }) });
	}

	/**
	 * @deprecated Use new-room-modal fragment
	 */
	get checkboxEncryption(): Locator {
		return this.page.locator('role=dialog[name="Create channel"] >> label >> text="Encrypted"');
	}

	/**
	 * @deprecated Use new-room-modal fragment
	 */
	get checkboxReadOnly(): Locator {
		return this.page.locator('label', { has: this.page.getByRole('checkbox', { name: 'Read-only' }) });
	}

	/**
	 * @deprecated Use new-room-modal fragment
	 */
	get inputChannelName(): Locator {
		return this.page.locator('#modal-root [data-qa="create-channel-modal"] [data-qa-type="channel-name-input"]');
	}

	/**
	 * @deprecated Use new-room-modal fragment
	 */
	get inputDirectUsername(): Locator {
		return this.page.locator('#modal-root [data-qa="create-direct-modal"] [data-qa-type="user-auto-complete-input"]');
	}

	/**
	 * @deprecated Use new-room-modal fragment
	 */
	get btnCreate(): Locator {
		return this.page.locator('role=button[name="Create"]');
	}

	/**
	 * @deprecated Use sidebar fragment
	 */
	get inputSearch(): Locator {
		return this.page.locator('[placeholder="Search (Ctrl+K)"]').first();
	}

	/**
	 * @deprecated Use navbar fragment
	 */
	get userProfileMenu(): Locator {
		return this.page.getByRole('button', { name: 'User menu', exact: true });
	}

	/**
	 * @deprecated Use sidebar fragment
	 */
	get sidebarChannelsList(): Locator {
		return this.page.getByRole('list', { name: 'Channels' });
	}

	// TODO: deprecate
	get sidebarToolbar(): Locator {
		return this.page.getByRole('toolbar', { name: 'Sidebar actions' });
	}

	/**
	 * @deprecated Use sidebar fragment
	 */
	async setDisplayMode(mode: 'Extended' | 'Medium' | 'Condensed'): Promise<void> {
		await this.sidebarToolbar.getByRole('button', { name: 'Display', exact: true }).click();
		await this.sidebarToolbar.getByRole('menuitemcheckbox', { name: mode }).click();
		await this.sidebarToolbar.click();
	}

	// Note: this is different from openChat because queued chats are not searchable
	/**
	 * @deprecated Use sidebar fragment
	 */
	getQueuedChat(name: string): Locator {
		return this.page.locator('[data-qa="sidebar-item-title"]', { hasText: new RegExp(`^${name}$`) }).first();
	}

	/**
	 * @deprecated Use navbar fragment
	 */
	get accountProfileOption(): Locator {
		return this.page.locator('role=menuitemcheckbox[name="Profile"]');
	}

	// TODO: refactor getSidebarItemByName to not use data-qa
	/**
	 * @deprecated Use sidebar fragment
	 */
	getSidebarItemByName(name: string, isRead?: boolean): Locator {
		return this.page.locator(
			['[data-qa="sidebar-item"]', `[aria-label="${name}"]`, isRead && '[data-unread="false"]'].filter(Boolean).join(''),
		);
	}

	/**
	 * @deprecated Use sidebar fragment: markItemAsUnread
	 */
	async selectMarkAsUnread(name: string) {
		const sidebarItem = this.getSidebarItemByName(name);
		await sidebarItem.focus();
		await sidebarItem.locator('.rcx-sidebar-item__menu').click();
		await this.page.getByRole('option', { name: 'Mark Unread' }).click();
	}

	/**
	 * @deprecated Use sidebar fragment
	 */
	async selectPriority(name: string, priority: string) {
		const sidebarItem = this.getSidebarItemByName(name);
		await sidebarItem.focus();
		await sidebarItem.locator('.rcx-sidebar-item__menu').click();
		await this.page.locator(`li[value="${priority}"]`).click();
	}

	/**
	 * @deprecated Use navbar fragment: openWorkspaceSettings
	 */
	async openAdministrationByLabel(text: string): Promise<void> {
		await this.page.locator('role=button[name="Administration"]').click();
		await this.page.locator(`role=menuitem[name="${text}"]`).click();
	}

	/**
	 * @deprecated Use navbar fragment
	 */
	async openInstalledApps(): Promise<void> {
		await this.page.locator('role=button[name="Administration"]').click();
		await this.page.locator('//div[contains(text(),"Installed")]').click();
	}

	/**
	 * @deprecated Use sidebar fragment: openCreateNewByLabel
	 */
	async openNewByLabel(text: string): Promise<void> {
		await this.page.locator('role=button[name="Create new"]').click();
		await this.page.locator(`role=menuitem[name="${text}"]`).click();
	}

	/**
	 * @deprecated Use sidebar fragment: typeSearch
	 */
	async openSearch(): Promise<void> {
		await this.page.locator('role=navigation >> role=button[name=Search]').click();
	}

	/**
	 * @deprecated Use sidebar fragment
	 */
	getSearchRoomByName(name: string): Locator {
		return this.page.locator(`role=search >> role=listbox >> role=link >> text="${name}"`);
	}

	/**
	 * @deprecated Use sidebar fragment: typeSearch
	 */
	async searchRoom(name: string): Promise<void> {
		await this.openSearch();
		await this.page.locator('role=search >> role=searchbox').fill(name);
	}

	/**
	 * @deprecated Use navbar fragment
	 */
	async logout(): Promise<void> {
		await this.userProfileMenu.click();
		await this.page.locator('//*[contains(@class, "rcx-option__content") and contains(text(), "Logout")]').click();
	}

	/**
	 * @deprecated Use navbar fragment
	 */
	async switchStatus(status: 'offline' | 'online'): Promise<void> {
		await this.userProfileMenu.click();
		await this.page.locator(`role=menuitemcheckbox[name="${status}"]`).click();
	}

	/**
	 * @deprecated Use sidebar fragment
	 */
	async openChat(name: string): Promise<void> {
		await this.searchRoom(name);
		await this.getSearchRoomByName(name).click();
		await this.waitForChannel();
	}

	/**
	 * @deprecated Use sidebar fragment
	 */
	async waitForChannel(): Promise<void> {
		await this.page.locator('role=main').waitFor();
		await this.page.locator('role=main >> role=heading[level=1]').waitFor();
		await this.page.locator('role=main >> role=list').waitFor();

		await expect(this.page.locator('role=main >> role=list')).not.toHaveAttribute('aria-busy', 'true');
	}

	/**
	 * @deprecated Use navbar fragment
	 */
	async switchOmnichannelStatus(status: 'offline' | 'online') {
		// button has a id of "omnichannel-status-toggle"
		const toggleButton = this.page.locator('#omnichannel-status-toggle');
		await expect(toggleButton).toBeVisible();

		enum StatusTitleMap {
			offline = 'Turn on answer chats',
			online = 'Turn off answer chats',
		}

		const currentStatus = await toggleButton.getAttribute('title');
		if (status === 'offline') {
			if (currentStatus === StatusTitleMap.online) {
				await toggleButton.click();
			}
		} else if (currentStatus === StatusTitleMap.offline) {
			await toggleButton.click();
		}

		await this.page.waitForTimeout(500);

		const newStatus = await this.page.locator('#omnichannel-status-toggle').getAttribute('title');
		expect(newStatus).toBe(status === 'offline' ? StatusTitleMap.offline : StatusTitleMap.online);
	}

	/**
	 * @deprecated Use sidebar fragment
	 */
	async createPublicChannel(name: string) {
		await this.openNewByLabel('Channel');
		await this.checkboxPrivateChannel.click();
		await this.inputChannelName.type(name);
		await this.btnCreate.click();
	}

	/**
	 * @deprecated Use navbar fragment
	 */
	async createEncryptedChannel(name: string) {
		await this.openNewByLabel('Channel');
		await this.inputChannelName.fill(name);
		await this.advancedSettingsAccordion.click();
		await this.checkboxEncryption.click();
		await this.btnCreate.click();
	}

	/**
	 * @deprecated Use sidebar fragment: getItemUnreadBadge
	 */
	getRoomBadge(roomName: string): Locator {
		return this.getSidebarItemByName(roomName).getByRole('status', { exact: true });
	}

	/**
	 * @deprecated Use sidebar fragment: getItemUnreadBadge
	 */
	getSearchChannelBadge(name: string): Locator {
		return this.page.locator(`[data-qa="sidebar-item"][aria-label="${name}"]`).first().getByRole('status', { exact: true });
	}
}
