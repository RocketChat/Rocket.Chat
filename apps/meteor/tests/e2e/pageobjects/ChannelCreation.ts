import { Locator, expect } from '@playwright/test';

import { BasePage } from './BasePage';
import { ENTER } from '../utils/mocks/keyboardKeyMock';

export class ChannelCreation extends BasePage {
	private get buttonCreate(): Locator {
		return this.page.locator('[data-qa="sidebar-create"]');
	}

	private get inputChannelName(): Locator {
		return this.page.locator('[placeholder="Channel Name"]');
	}

	private get inputChannelDescription(): Locator {
		return this.page.locator('[placeholder="What is this channel about?"]');
	}

	private get buttonCreateChannel(): Locator {
		return this.page.locator('//ul[@class="rc-popover__list"]//li[@class="rcx-option"][1]');
	}

	private get channelName(): Locator {
		return this.page.locator('//header//div//div//div//div[2]');
	}

	private get buttonConfirmCreation(): Locator {
		return this.page.locator('//button[contains(text(), "Create" )]');
	}

	private get privateChannel(): Locator {
		return this.page.locator('//label[contains(text(),"Private")]/../following-sibling::label/i');
	}

	private get searchChannel(): Locator {
		return this.page.locator('[data-qa="sidebar-search"]');
	}

	private get searchChannelInput(): Locator {
		return this.page.locator('[data-qa="sidebar-search-input"]');
	}

	private get textArea(): Locator {
		return this.page.locator('.rc-message-box__textarea');
	}

	private get lastMessage(): Locator {
		return this.page.locator('.message:last-child .body');
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

	public async sendMessage(targetUser: string, message: string): Promise<void> {
		await this.searchChannel.click();
		await this.searchChannelInput.type(targetUser, { delay: 200 });
		await this.keyboardPress(ENTER);

		await this.textArea.type(message);
		await this.keyboardPress(ENTER);

		await expect(this.lastMessage).toBeVisible();
		await expect(this.lastMessage).toHaveText(message);
	}
}
