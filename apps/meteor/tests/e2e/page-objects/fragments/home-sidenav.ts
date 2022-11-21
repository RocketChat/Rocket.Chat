import type { Locator, Page } from '@playwright/test';

import { expect } from '../../utils/test';

export class HomeSidenav {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get checkboxPrivateChannel(): Locator {
		return this.page.locator(
			'//*[@id="modal-root"]//*[contains(@class, "rcx-field") and contains(text(), "Private")]/../following-sibling::label/i',
		);
	}

	get inputChannelName(): Locator {
		return this.page.locator('#modal-root [data-qa="create-channel-modal"] [data-qa-type="channel-name-input"]');
	}

	get inputDirectUsername(): Locator {
		return this.page.locator('#modal-root [data-qa="create-direct-modal"] [data-qa-type="user-auto-complete-input"]');
	}

	get btnCreate(): Locator {
		return this.page.locator('//*[@id="modal-root"]//button[contains(text(), "Create")]');
	}

	async openAdministrationByLabel(text: string): Promise<void> {
		await this.page.locator('role=button[name="Administration"]').click();
		await this.page.locator(`li.rcx-option >> text="${text}"`).click();
	}

	async openNewByLabel(text: string): Promise<void> {
		await this.page.locator('[data-qa="sidebar-create"]').click();
		await this.page.locator(`li.rcx-option >> text="${text}"`).click();
	}

	async logout(): Promise<void> {
		await this.page.locator('[data-qa="sidebar-avatar-button"]').click();
		await this.page.locator('//*[contains(@class, "rcx-option__content") and contains(text(), "Logout")]').click();
	}

	async switchStatus(status: 'offline' | 'online'): Promise<void> {
		await this.page.locator('[data-qa="sidebar-avatar-button"]').click();
		await this.page.locator(`//li[@class="rcx-option"]//div[contains(text(), "${status}")]`).click();
	}

	async openChat(name: string): Promise<void> {
		await this.page.locator('[data-qa="sidebar-search"]').click();
		await this.page.locator('[data-qa="sidebar-search-input"]').type(name);
		await this.page.locator(`[data-qa="sidebar-item-title"] >> text="${name}"`).first().click();
	}

	async switchOmnichannelStatus(status: 'offline' | 'online') {
		// button has a id of "omnichannel-status-toggle"
		const toggleButton = this.page.locator('#omnichannel-status-toggle');
		expect(toggleButton).toBeVisible();

		enum StatusTitleMap {
			offline = 'Turn on answer chats',
			online = 'Turn off answer chats',
		}

		const currentStatus: StatusTitleMap = (await toggleButton.getAttribute('data-tooltip')) as any;
		if (status === 'offline') {
			if (currentStatus === StatusTitleMap.online) {
				await toggleButton.click();
			}
		} else if (currentStatus === StatusTitleMap.offline) {
			await toggleButton.click();
		}

		await this.page.waitForTimeout(500);

		const newStatus: StatusTitleMap = (await this.page.locator('#omnichannel-status-toggle').getAttribute('data-tooltip')) as any;
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
