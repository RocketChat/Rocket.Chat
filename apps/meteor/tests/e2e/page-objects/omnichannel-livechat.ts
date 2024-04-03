import fs from 'fs/promises';

import type { Page, Locator, APIResponse } from '@playwright/test';

import { expect } from '../utils/test';

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

	get btnChangeDepartment(): Locator {
		return this.page.locator(`button >> text="Change department"`);
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
	
	get headerTitle(): Locator {
		return this.page.locator('[data-qa="header-title"]');
	}

	alertMessage(message: string): Locator {
		return this.page.getByRole('alert').locator(`text="${message}"`);
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
		const { value: siteName } = await (await this.api.get('/settings/Livechat_title')).json();
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

	get selectDepartment(): Locator {
		return this.page.locator('[name="department"]');
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

	get btnYes(): Locator {
		return this.page.locator('role=button[name="Yes"]');
	}

	get onlineAgentMessage(): Locator {
		return this.page.locator('[contenteditable="true"]');
	}

	get btnSendMessageToOnlineAgent(): Locator {
		return this.page.locator('footer div div div:nth-child(3) button');
	}

	get livechatModal(): Locator {
		return this.page.locator('[data-qa-type="modal-overlay"]');
	}

	livechatModalText(text: string): Locator {
		return this.page.locator(`[data-qa-type="modal-overlay"] >> text=${text}`);
	}

	get fileUploadTarget(): Locator {
		return this.page.locator('#files-drop-target');
	}

	findUploadedFileLink (fileName: string): Locator {
		return this.page.getByRole('link', { name: fileName });
	}

	public async sendMessage(liveChatUser: { name: string; email: string }, isOffline = true, department?: string): Promise<void> {
		const buttonLabel = isOffline ? 'Send' : 'Start chat';
		await this.inputName.fill(liveChatUser.name);
		await this.inputEmail.fill(liveChatUser.email);

		if (department) {
			await this.selectDepartment.selectOption({ label: department });
		}

		if (isOffline) {
			await this.textAreaMessage.type('any_message');
		}

		await this.btnSendMessage(buttonLabel).click();
		await this.page.waitForSelector('[data-qa="livechat-composer"]');
	}

	public async sendMessageAndCloseChat(
		liveChatUser: { name: string; email: string },
		message = 'this_a_test_message_from_user',
	): Promise<void> {
		await this.openAnyLiveChat();
		await this.sendMessage(liveChatUser, false);
		await this.onlineAgentMessage.type(message);
		await this.btnSendMessageToOnlineAgent.click();
		await expect(this.txtChatMessage(message)).toBeVisible();
		await this.closeChat();
	}

	async dragAndDropTxtFile(): Promise<void> {
		const contract = await fs.readFile('./tests/e2e/fixtures/files/any_file.txt', 'utf-8');
		const dataTransfer = await this.page.evaluateHandle((contract) => {
			const data = new DataTransfer();
			const file = new File([`${contract}`], 'any_file.txt', {
				type: 'text/plain',
			});
			data.items.add(file);
			return data;
		}, contract);

		await this.fileUploadTarget.dispatchEvent('dragenter', { dataTransfer });

		await this.fileUploadTarget.dispatchEvent('drop', { dataTransfer });
	}

	async dragAndDropLstFile(): Promise<void> {
		const contract = await fs.readFile('./tests/e2e/fixtures/files/lst-test.lst', 'utf-8');
		const dataTransfer = await this.page.evaluateHandle((contract) => {
			const data = new DataTransfer();
			const file = new File([`${contract}`], 'lst-test.lst', {
				type: 'text/plain',
			});
			data.items.add(file);
			return data;
		}, contract);

		await this.fileUploadTarget.dispatchEvent('dragenter', { dataTransfer });

		await this.fileUploadTarget.dispatchEvent('drop', { dataTransfer });
	}
}
