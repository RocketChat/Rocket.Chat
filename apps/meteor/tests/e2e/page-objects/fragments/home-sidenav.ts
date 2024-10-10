import type { Locator, Page } from '@playwright/test';

import { expect } from '../../utils/test';

export class HomeSidenav {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get advancedSettingsAccordion(): Locator {
		return this.page.getByRole('dialog').getByRole('button', { name: 'Advanced settings', exact: true });
	}

	get checkboxPrivateChannel(): Locator {
		return this.page.locator('label', { has: this.page.getByRole('checkbox', { name: 'Private' }) });
	}

	get checkboxEncryption(): Locator {
		return this.page.locator('role=dialog[name="Create channel"] >> label >> text="Encrypted"');
	}

	get checkboxReadOnly(): Locator {
		return this.page.locator('label', { has: this.page.getByRole('checkbox', { name: 'Read-only' }) });
	}

	get inputChannelName(): Locator {
		return this.page.locator('#modal-root [data-qa="create-channel-modal"] [data-qa-type="channel-name-input"]');
	}

	get inputDirectUsername(): Locator {
		return this.page.locator('#modal-root [data-qa="create-direct-modal"] [data-qa-type="user-auto-complete-input"]');
	}

	get btnCreate(): Locator {
		return this.page.locator('role=button[name="Create"]');
	}

	get userProfileMenu(): Locator {
		return this.page.getByRole('navigation', { name: 'header' }).getByRole('button', { name: 'User menu', exact: true });
	}

	get sidebarChannelsList(): Locator {
		return this.page.getByRole('list', { name: 'Channels' });
	}

	get sidebarToolbar(): Locator {
		return this.page.getByRole('toolbar', { name: 'Sidebar actions' });
	}

	get sidebarSearchSection(): Locator {
		return this.page.getByRole('navigation', { name: 'sidebar' }).getByRole('search');
	}

	async setDisplayMode(mode: 'Extended' | 'Medium' | 'Condensed'): Promise<void> {
		const displayButton = this.sidebarSearchSection.getByRole('button', { name: 'Display', exact: true });
		await displayButton.click();
		await this.sidebarSearchSection.getByRole('group', { name: 'Display' }).getByRole('menuitemcheckbox', { name: mode }).click();
		await displayButton.click();
	}

	// Note: this is different from openChat because queued chats are not searchable
	getQueuedChat(name: string): Locator {
		return this.page.getByRole('listitem').getByRole('link', { name });
	}

	get accountProfileOption(): Locator {
		return this.page.getByRole('menu').getByRole('menuitemcheckbox', { name: 'Profile' });
	}

	// TODO: refactor getSidebarItemByName to not use data-qa
	getSidebarItemByName(name: string): Locator {
		return this.page.getByRole('listitem').getByRole('link', { name });
	}

	getSidebarItemRead(name: string): Locator {
		return this.page.getByRole('listitem').getByRole('link', { name }).locator('[data-unread=false]');
	}

	async selectMarkAsUnread(name: string) {
		const sidebarItem = this.getSidebarItemByName(name);
		await sidebarItem.focus();
		await sidebarItem.locator('.rcx-sidebar-v2-item__menu-wrapper').click();
		await this.page.getByRole('listbox').getByRole('option', { name: 'Mark Unread' }).click();
	}

	async selectPriority(name: string, priority: string) {
		const sidebarItem = this.getSidebarItemByName(name);
		await sidebarItem.focus();
		await sidebarItem.locator('.rcx-sidebar-v2-item__menu-wrapper').click();
		await this.page.locator(`li[value="${priority}"]`).click();
	}

	async openAdministrationByLabel(text: string): Promise<void> {
		await this.page.getByRole('navigation', { name: 'header' }).getByRole('group').getByRole('button', { name: 'Manage' }).click();
		await this.page.getByRole('group').getByRole('menuitem', { name: text }).click();
	}

	async openInstalledApps(): Promise<void> {
		await this.page.locator('role=button[name="Administration"]').click();
		await this.page.locator('//div[contains(text(),"Installed")]').click();
	}

	async openNewByLabel(text: string): Promise<void> {
		await this.sidebarSearchSection.getByRole('button', { name: 'Create new', exact: true }).click();
		await this.sidebarSearchSection.getByRole('menuitem', { name: text }).click();
	}

	async typeSearch(text: string): Promise<void> {
		await this.page.getByRole('navigation', { name: 'sidebar' }).getByRole('searchbox', { name: 'Search' }).fill(text);
	}

	getSearchRoomByName(name: string): Locator {
		return this.page.getByRole('search').getByRole('listbox').getByRole('link', { name, exact: true });
	}

	async searchRoom(name: string): Promise<void> {
		await this.typeSearch(name);
	}

	async logout(): Promise<void> {
		await this.userProfileMenu.click();
		await this.page.getByRole('menu').getByRole('menuitemcheckbox', { name: 'Logout' }).click();
	}

	async switchStatus(status: 'offline' | 'online'): Promise<void> {
		await this.userProfileMenu.click();
		await this.page.getByRole('menu').getByRole('menuitemcheckbox', { name: status }).click();
	}

	async openChat(name: string): Promise<void> {
		await this.searchRoom(name);
		await this.getSearchRoomByName(name).click();
		await this.waitForChannel();
	}

	async waitForChannel(): Promise<void> {
		await this.page.locator('role=main').waitFor();
		await this.page.locator('role=main >> role=heading[level=1]').waitFor();
		await this.page.locator('role=main >> role=list').waitFor();

		await expect(this.page.locator('role=main >> role=list')).not.toHaveAttribute('aria-busy', 'true');
	}

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

	async createPublicChannel(name: string) {
		await this.openNewByLabel('Channel');
		await this.checkboxPrivateChannel.click();
		await this.inputChannelName.type(name);
		await this.btnCreate.click();
	}

	async createEncryptedChannel(name: string) {
		await this.openNewByLabel('Channel');
		await this.inputChannelName.type(name);
		await this.advancedSettingsAccordion.click();
		await this.checkboxEncryption.click();
		await this.btnCreate.click();
	}

	getSidebarItemBadge(roomName: string): Locator {
		return this.getSidebarItemByName(roomName).getByRole('status');
	}

	getSearchChannelBadge(name: string): Locator {
		return this.page.locator(`[data-qa="sidebar-item"][aria-label="${name}"]`).first().getByRole('status', { exact: true });
	}
}
