import type { Page, Locator } from '@playwright/test';

export class OmnichannelLiveChatEmbedded {
	readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	btnOpenLiveChat(): Locator {
		return this.page.frameLocator('#rocketchat-iframe').locator(`[data-qa-id="chat-button"]`);
	}

	btnOpenOfflineLiveChat(): Locator {
		return this.page.frameLocator('#rocketchat-iframe').locator(`button[aria-label="Leave a message"]`);
	}

	btnFinishOfflineMessage(): Locator {
		return this.page.frameLocator('#rocketchat-iframe').locator(`button[aria-label="OK"]`);
	}

	get btnOptions(): Locator {
		return this.page.frameLocator('#rocketchat-iframe').locator(`button >> text="Options"`);
	}

	get btnCloseChat(): Locator {
		return this.page.frameLocator('#rocketchat-iframe').locator(`button >> text="Finish this chat"`);
	}

	get btnCloseChatConfirm(): Locator {
		return this.page.frameLocator('#rocketchat-iframe').locator(`button >> text="Yes"`);
	}

	get txtHeaderTitle(): Locator {
		return this.page.frameLocator('#rocketchat-iframe').locator('div >> text="Chat Finished"');
	}

	get btnChatNow(): Locator {
		return this.page.frameLocator('#rocketchat-iframe').locator('[type="button"] >> text="Chat now"');
	}

	txtChatMessage(message: string): Locator {
		return this.page.frameLocator('#rocketchat-iframe').locator(`li >> text="${message}"`);
	}

	async closeChat(): Promise<void> {
		await this.btnOptions.click();
		await this.btnCloseChat.click();
		await this.btnCloseChatConfirm.click();
	}

	async openLiveChat(): Promise<void> {
		await this.btnOpenLiveChat().click();
	}

	unreadMessagesBadge(count: number): Locator {
		const name = count === 1 ? `${count} unread message` : `${count} unread messages`;

		return this.page.frameLocator('#rocketchat-iframe').locator(`role=status[name="${name}"]`);
	}

	get inputName(): Locator {
		return this.page.frameLocator('#rocketchat-iframe').locator('[name="name"]');
	}

	get inputEmail(): Locator {
		return this.page.frameLocator('#rocketchat-iframe').locator('[name="email"]');
	}

	get textAreaMessage(): Locator {
		return this.page.frameLocator('#rocketchat-iframe').locator('[name="message"]');
	}

	btnSendMessage(btnText: string): Locator {
		return this.page.frameLocator('#rocketchat-iframe').locator(`role=button[name="${btnText}"]`);
	}

	get btnOk(): Locator {
		return this.page.frameLocator('#rocketchat-iframe').locator('role=button[name="OK"]');
	}

	get onlineAgentMessage(): Locator {
		return this.page.frameLocator('#rocketchat-iframe').locator('[contenteditable="true"]');
	}

	get btnSendMessageToOnlineAgent(): Locator {
		return this.page.frameLocator('#rocketchat-iframe').locator('footer div div div:nth-child(3) button');
	}

	get firstAutoMessage(): Locator {
		return this.page.frameLocator('#rocketchat-iframe').locator('div.message-text__WwYco p');
	}

	public async sendMessage(liveChatUser: { name: string; email: string }, isOffline = true): Promise<void> {
		const buttonLabel = isOffline ? 'Send' : 'Start chat';
		await this.inputName.type(liveChatUser.name);
		await this.inputEmail.type(liveChatUser.email);
		if (isOffline) {
			await this.textAreaMessage.type('any_message');
			await this.btnSendMessage(buttonLabel).click();
			return this.btnFinishOfflineMessage().click();
		}
		await this.btnSendMessage(buttonLabel).click();
		await this.page.frameLocator('#rocketchat-iframe').locator('[data-qa="livechat-composer"]').waitFor();
	}
}
