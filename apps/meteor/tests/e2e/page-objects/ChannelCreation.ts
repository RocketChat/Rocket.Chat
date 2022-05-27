import { Locator, expect } from '@playwright/test';

import { BasePage } from './BasePage';
import { ENTER } from '../utils/mocks/keyboardKeyMock';

export class ChannelCreation extends BasePage {
	private get inputChannelDescription(): Locator {
		return this.page.locator('[placeholder="What is this channel about?"]');
	}

	private get btnCreateChannel(): Locator {
		return this.page.locator('//ul[@class="rc-popover__list"]//li[@class="rcx-option"][1]');
	}

	private get textChannelName(): Locator {
		return this.page.locator('//header//div//div//div//div[2]');
	}

	private get privateChannel(): Locator {
		return this.page.locator('//label[contains(text(),"Private")]/../following-sibling::label/i');
	}

	private get btnSearchChannel(): Locator {
		return this.page.locator('[data-qa="sidebar-search"]');
	}

	private get inputSearchChannel(): Locator {
		return this.page.locator('[data-qa="sidebar-search-input"]');
	}

	async doCreateChannel(name: string, isPrivate: boolean): Promise<void> {
		await this.page.locator('[data-qa="sidebar-create"]').click();
		await this.btnCreateChannel.click();

		await this.page.locator('[placeholder="Channel Name"]').type(name);
		await this.inputChannelDescription.type('any_description');

		if (!isPrivate) {
			await this.privateChannel.click();
		}

		await this.page.locator('//button[contains(text(), "Create" )]').click();

		await expect(this.textChannelName).toHaveText(name);
	}

	async doSendMessage(targetUser: string, message: string): Promise<void> {
		await this.btnSearchChannel.click();
		await this.inputSearchChannel.type(targetUser, { delay: 200 });
		await this.keyPress(ENTER);

		await this.page.locator('.rc-message-box__textarea').type(message);
		await this.keyPress(ENTER);

		await expect(this.page.locator('.message:last-child .body')).toBeVisible();
		await expect(this.page.locator('.message:last-child .body')).toHaveText(message);
	}
}
