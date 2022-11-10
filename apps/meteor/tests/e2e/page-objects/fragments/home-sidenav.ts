import type { Locator, Page } from '@playwright/test';

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

	get btnCreateChannel(): Locator {
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

	async openDisplayOptions(): Promise<void> {
		await this.page.locator('[title="Display"]').click();
	}

	async selectOrderByName(): Promise<void> {
		const label = this.page.locator('text=⦇Name >> label')

		if (!await label.locator('input').isChecked()) {
			await label.click()

			// Wait for child change
			await this.page.locator('.rooms-list .rc-scrollbars-view > div > div').evaluate(div => {
				return new Promise<void>(resolve => {
					new window.MutationObserver(() => {
						resolve();
					}).observe(div, { childList: true });
				});
			});
		}
	}

	async selectOrderByActivity(): Promise<void> {
		await this.page.locator('text=Activity >> label').click();
	}

	async getChannels(): Promise<string[]> {
		const items = await this.page.$$('.rc-scrollbars-view div[data-index]')
		const channels: string[] = []

		let inChannels = false
		for (const item of items) {
			if (!inChannels) {
				const sidebar = await item.$('.rcx-sidebar-section .rcx-sidebar-title')
				if (!sidebar) continue

				const sidebarText = await sidebar.textContent()
				if (sidebarText === 'Channels') {
					inChannels = true
				}

				continue
			}

			const channel = await item.$('.rcx-sidebar-item .rcx-sidebar-item__title')
			const channelName = await channel?.textContent()

			if (channelName) channels.push(channelName)
		}

		return channels;
	}

	// Note: this is a workaround for now since queued omnichannel chats are not searchable yet so we can't use openChat() :(
	async openQueuedOmnichannelChat(name: string): Promise<void> {
		await this.page.locator('[data-qa="sidebar-item-title"]', { hasText: name }).first().click();
	}

	async createPublicChannel(name: string) {
		await this.openNewByLabel('Channel');
		await this.checkboxPrivateChannel.click();
		await this.inputChannelName.type(name);
		await this.btnCreateChannel.click();
	}
}
