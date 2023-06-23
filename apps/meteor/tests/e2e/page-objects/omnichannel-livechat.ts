import type { Page, Locator, APIResponse } from '@playwright/test';

export class OmnichannelLiveChat {
	private readonly page: Page;

	constructor(page: Page, private readonly api: { get(url: string): Promise<APIResponse> }) {
		this.page = page;
	}

	btnOpenLiveChat(label: string): Locator {
		return this.page.locator(`role=button[name="${label}"]`);
	}

	async openLiveChat(): Promise<void> {
		const { value: siteName } = await (await this.api.get('/settings/Site_Name')).json();
		await this.btnOpenLiveChat(siteName).click();
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
		return this.page.locator(`[type="submit"] >> text="${btnText}"`);
	}

	get btnOk(): Locator {
		return this.page.locator('button >> text="OK"');
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
	}
}
