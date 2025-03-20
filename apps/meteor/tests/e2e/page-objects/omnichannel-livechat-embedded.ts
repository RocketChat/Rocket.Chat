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

	get headerTitle(): Locator {
		return this.page.frameLocator('#rocketchat-iframe').locator('[data-qa="header-title"]');
	}

	get btnChatNow(): Locator {
		return this.page.frameLocator('#rocketchat-iframe').locator('[type="button"] >> text="Chat now"');
	}

	get btnNewChat(): Locator {
		return this.page.frameLocator('#rocketchat-iframe').locator(`role=button[name="New Chat"]`);
	}

	get messageList(): Locator {
		return this.page.frameLocator('#rocketchat-iframe').locator('[data-qa="message-list"]');
	}

	get messageListBackground(): Promise<string> {
		return this.messageList.evaluate((el) => window.getComputedStyle(el).getPropertyValue('background-color'));
	}

	messageBubble(message: string): Locator {
		return this.page
			.frameLocator('#rocketchat-iframe')
			.locator('[data-qa="message-bubble"]', { has: this.page.frameLocator('#rocketchat-iframe').locator(`div >> text="${message}"`) });
	}

	messageBubbleBackground(message: string): Promise<string> {
		return this.messageBubble(message)
			.last()
			.evaluate((el) => window.getComputedStyle(el).getPropertyValue('background-color'));
	}

	txtChatMessage(message: string): Locator {
		return this.page.frameLocator('#rocketchat-iframe').locator(`li >> text="${message}"`);
	}

	imgAvatar(username: string): Locator {
		return this.page.frameLocator('#rocketchat-iframe').locator(`img[alt="${username}"]`).last();
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
		await this.inputName.fill(liveChatUser.name);
		await this.inputEmail.fill(liveChatUser.email);
		if (isOffline) {
			await this.textAreaMessage.fill('any_message');
			await this.btnSendMessage(buttonLabel).click();
			return this.btnFinishOfflineMessage().click();
		}
		await this.btnSendMessage(buttonLabel).click();
		await this.page.frameLocator('#rocketchat-iframe').locator('[data-qa="livechat-composer"]').waitFor();
	}
}
