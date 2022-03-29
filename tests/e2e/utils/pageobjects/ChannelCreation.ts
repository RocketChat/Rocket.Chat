import { Page, Locator, expect } from '@playwright/test';

export default class ChannelCreation {
	private inputChannelName: Locator;

	private buttonCreateChannel: Locator;

	private buttonCreate: Locator;

	private inputChannelDescription: Locator;

	private page: Page;

	private channelName: Locator;

	private buttonConfirmCreation: Locator;

	private privateChannel: Locator;

	private searchChannel: Locator;

	private searchChannelInput: Locator;

	constructor(page: Page) {
		this.page = page;
		this.buttonCreate = page.locator('[data-qa="sidebar-create"]');
		this.inputChannelName = page.locator('[placeholder="Channel Name"]');
		this.inputChannelDescription = page.locator('[placeholder="What is this channel about?"]');
		this.buttonCreateChannel = page.locator('//ul[@class="rc-popover__list"]//li[@class="rcx-option"][1]');
		this.channelName = page.locator('//header//div//div//div//div[2]');
		this.buttonConfirmCreation = page.locator('//button[contains(text(), "Create" )]');
		this.privateChannel = page.locator('//label[contains(text(),"Private")]/../following-sibling::label/i');
		this.searchChannel = page.locator('[data-qa="sidebar-search"]');
		this.searchChannelInput = page.locator('[data-qa="sidebar-search-input"]');
	}

	public async createChannel(name: string, isPrivate: boolean): Promise<void> {
		await this.buttonCreate.click();
		await this.buttonCreateChannel.click();
		await this.inputChannelName.type(name);
		await this.inputChannelDescription.type('any_description');
		if (!isPrivate) {
			await this.privateChannel.click();
		}
		await this.buttonConfirmCreation.click();

		await expect(this.channelName).toHaveText(name);
	}

	public async sendMessage(targetUser: string): Promise<void> {
		await this.searchChannel.click();
		await this.searchChannelInput.type(targetUser);
		await this.page.keyboard.press('Enter');

		await this.page.type('.rc-message-box__textarea', 'Hello');
		await this.page.keyboard.press('Enter');
		const message = this.page.locator('.message:last-child .body');

		await expect(message).toBeVisible();
		await expect(message).toHaveText('Hello');
	}
}
