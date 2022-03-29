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

	constructor(page: Page) {
		this.page = page;
		this.buttonCreate = page.locator('[data-qa="sidebar-create"]');
		this.inputChannelName = page.locator('[placeholder="Channel Name"]');
		this.inputChannelDescription = page.locator('[placeholder="What is this channel about?"]');
		this.buttonCreateChannel = page.locator('//ul[@class="rc-popover__list"]//li[@class="rcx-option"][1]');
		this.channelName = page.locator('//header//div//div//div//div[2]');
		this.buttonConfirmCreation = page.locator('//button[contains(text(), "Create" )]');
		this.privateChannel = page.locator('//label[contains(text(),"Private")]/../following-sibling::label/i');
	}

	public async createPrivateChannel(name: string, isPrivate: boolean): Promise<void> {
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
}
