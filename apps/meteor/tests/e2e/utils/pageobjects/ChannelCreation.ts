import { Locator, expect } from '@playwright/test';

import BasePage from './BasePage';
import { ENTER } from '../mocks/keyboardKeyMock';

export default class ChannelCreation extends BasePage {
	private buttonCreate(): Locator {
		return this.getPage().locator('[data-qa="sidebar-create"]');
	}

	private inputChannelName(): Locator {
		return this.getPage().locator('[placeholder="Channel Name"]');
	}

	private inputChannelDescription(): Locator {
		return this.getPage().locator('[placeholder="What is this channel about?"]');
	}

	private buttonCreateChannel(): Locator {
		return this.getPage().locator('//ul[@class="rc-popover__list"]//li[@class="rcx-option"][1]');
	}

	private channelName(): Locator {
		return this.getPage().locator('//header//div//div//div//div[2]');
	}

	private buttonConfirmCreation(): Locator {
		return this.getPage().locator('//button[contains(text(), "Create" )]');
	}

	private privateChannel(): Locator {
		return this.getPage().locator('//label[contains(text(),"Private")]/../following-sibling::label/i');
	}

	private searchChannel(): Locator {
		return this.getPage().locator('[data-qa="sidebar-search"]');
	}

	private searchChannelInput(): Locator {
		return this.getPage().locator('[data-qa="sidebar-search-input"]');
	}

	private textArea(): Locator {
		return this.getPage().locator('.rc-message-box__textarea');
	}

	private lastMessage(): Locator {
		return this.getPage().locator('.message:last-child .body');
	}

	public async createChannel(name: string, isPrivate: boolean): Promise<void> {
		await this.buttonCreate().click();
		await this.buttonCreateChannel().click();
		await this.inputChannelName().type(name);
		await this.inputChannelDescription().type('any_description');
		if (!isPrivate) {
			await this.privateChannel().click();
		}
		await this.buttonConfirmCreation().click();

		await expect(this.channelName()).toHaveText(name);
	}

	public async sendMessage(targetUser: string, message: string): Promise<void> {
		await this.searchChannel().click();
		await this.searchChannelInput().type(targetUser, { delay: 200 });
		await this.keyboardPress(ENTER);

		await this.textArea().type(message);
		await this.keyboardPress(ENTER);

		await expect(this.lastMessage()).toBeVisible();
		await expect(this.lastMessage()).toHaveText(message);
	}
}
