import type { Page, Locator, APIResponse } from '@playwright/test';

export class OmnichannelLiveChat {
	readonly page: Page;

	constructor(page: Page, private readonly api: { get(url: string): Promise<APIResponse> }) {
		this.page = page;
	}

	btnOpenOnlineLiveChat(label: string): Locator {
		return this.page.locator(`role=button[name="${label}"]`);
	}

	btnOpenLiveChat(): Locator {
		return this.page.locator(`[data-qa-id="chat-button"]`);
	}

	get btnNewChat(): Locator {
		return this.page.locator(`role=button[name="New Chat"]`);
	}

	get btnOptions(): Locator {
		return this.page.locator(`button >> text="Options"`);
	}

	get btnCloseChat(): Locator {
		return this.page.locator(`button >> text="Finish this chat"`);
	}

	get btnCloseChatConfirm(): Locator {
		return this.page.locator(`button >> text="Yes"`);
	}

	get txtHeaderTitle(): Locator {
		return this.page.locator('div >> text="Chat Finished"');
	}

	get btnChatNow(): Locator {
		return this.page.locator('[type="button"] >> text="Chat now"');
	}

	txtChatMessage(message: string): Locator {
		return this.page.locator(`text="${message}"`);
	}

	async closeChat(): Promise<void> {
		await this.btnOptions.click();
		await this.btnCloseChat.click();
		await this.btnCloseChatConfirm.click();
	}

	async openLiveChat(): Promise<void> {
		const { value: siteName } = await (await this.api.get('/settings/Site_Name')).json();
		await this.btnOpenOnlineLiveChat(siteName).click();
	}

	// TODO: replace openLivechat with this method and create a new method for openOnlineLivechat
	// as openLivechat only opens a chat that is in the 'online' state
	async openAnyLiveChat(): Promise<void> {
		await this.btnOpenLiveChat().click();
	}

	async startNewChat(): Promise<void> {
		await this.btnNewChat.click();
	}

	unreadMessagesBadge(count: number): Locator {
		const name = count === 1 ? `${count} unread message` : `${count} unread messages`;

		return this.page.locator(`role=status[name="${name}"]`);
	}

	get inputName(): Locator {
		return this.page.locator('[name="name"]');
	}

	get inputEmail(): Locator {
		return this.page.locator('[name="email"]');
	}

	get textAreaMessage(): Locator {
		return this.page.locator('[name="message"]');
	}

	btnSendMessage(btnText: string): Locator {
		return this.page.locator(`role=button[name="${btnText}"]`);
	}

	get btnOk(): Locator {
		return this.page.locator('role=button[name="OK"]');
	}

	get onlineAgentMessage(): Locator {
		return this.page.locator('[contenteditable="true"]');
	}

	get btnSendMessageToOnlineAgent(): Locator {
		return this.page.locator('footer div div div:nth-child(3) button');
	}

	get firstAutoMessage(): Locator {
		return this.page.locator('div.message-text__WwYco p');
	}

	public async sendMessage(liveChatUser: { name: string; email: string }, isOffline = true): Promise<void> {
		const buttonLabel = isOffline ? 'Send' : 'Start chat';
		await this.inputName.type(liveChatUser.name);
		await this.inputEmail.type(liveChatUser.email);
		if (isOffline) {
			await this.textAreaMessage.type('any_message');
		}
		await this.btnSendMessage(buttonLabel).click();
		await this.page.waitForSelector('[data-qa="livechat-composer"]');
	}

	public async sendMessageAndCloseChat(liveChatUser: { name: string; email: string }): Promise<void> {
		await this.openLiveChat();
		await this.sendMessage(liveChatUser, false);
		await this.onlineAgentMessage.type('this_a_test_message_from_user');
		await this.btnSendMessageToOnlineAgent.click();
		await this.closeChat();
	}
}
