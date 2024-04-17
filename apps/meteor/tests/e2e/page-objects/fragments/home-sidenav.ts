import type { Locator, Page } from '@playwright/test';

import { expect } from '../../utils/test';

export class HomeSidenav {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
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

	get inputSearch(): Locator {
		return this.page.locator('[placeholder="Search (Ctrl+K)"]').first();
	}

	get userProfileMenu(): Locator {
		return this.page.getByRole('button', { name: 'User menu' });
	}

	get sidebarChannelsList(): Locator {
		return this.page.getByRole('list', { name: 'Channels' });
	}

	get sidebarToolbar(): Locator {
		return this.page.getByRole('toolbar', { name: 'Sidebar actions' });
	}

	getSidebarItemByName(name: string): Locator {
		return this.page.locator(`[data-qa="sidebar-item"][aria-label="${name}"]`);
	}

	async selectPriority(name: string, priority: string) {
		const sidebarItem = this.getSidebarItemByName(name);
		await sidebarItem.focus();
		await sidebarItem.locator('.rcx-sidebar-item__menu').click();
		await this.page.locator(`li[value="${priority}"]`).click();
	}

	async openAdministrationByLabel(text: string): Promise<void> {
		await this.page.locator('role=button[name="Administration"]').click();
		await this.page.locator(`role=menuitem[name="${text}"]`).click();
	}

	async openInstalledApps(): Promise<void> {
		await this.page.locator('role=button[name="Administration"]').click();
		await this.page.locator('//div[contains(text(),"Installed")]').click();
	}

	async openNewByLabel(text: string): Promise<void> {
		await this.page.locator('role=button[name="Create new"]').click();
		await this.page.locator(`role=menuitem[name="${text}"]`).click();
	}

	async openSearch(): Promise<void> {
		await this.page.locator('role=button[name="Search"]').click();
	}

	async logout(): Promise<void> {
		await this.userProfileMenu.click();
		await this.page.locator('//*[contains(@class, "rcx-option__content") and contains(text(), "Logout")]').click();
	}

	async switchStatus(status: 'offline' | 'online'): Promise<void> {
		await this.userProfileMenu.click();
		await this.page.locator(`role=menuitemcheckbox[name="${status}"]`).click();
	}

	async openChat(name: string): Promise<void> {
		await this.page.locator('role=navigation >> role=button[name=Search]').click();
		await this.page.locator('role=search >> role=searchbox').type(name);
		await this.page.locator(`role=search >> role=listbox >> role=link >> text="${name}"`).click();
		await this.waitForChannel();
	}

	async waitForChannel(): Promise<void> {
		await this.page.locator('role=main').waitFor();
		await this.page.locator('role=main >> role=heading[level=1]').waitFor();

		await expect(this.page.locator('role=main >> .rcx-skeleton')).toHaveCount(0);
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

	// Note: this is a workaround for now since queued omnichannel chats are not searchable yet so we can't use openChat() :(
	async openQueuedOmnichannelChat(name: string): Promise<void> {
		await this.page.locator('[data-qa="sidebar-item-title"]', { hasText: name }).first().click();
	}

	async createPublicChannel(name: string) {
		await this.openNewByLabel('Channel');
		await this.checkboxPrivateChannel.click();
		await this.inputChannelName.type(name);
		await this.btnCreate.click();
	}
}
