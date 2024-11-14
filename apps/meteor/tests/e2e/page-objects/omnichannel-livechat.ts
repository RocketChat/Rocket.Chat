import fs from 'fs/promises';

import { faker } from '@faker-js/faker';
import type { Page, Locator, APIResponse, FrameLocator } from '@playwright/test';

import { createFakeVisitor } from '../../mocks/data';

type LivechatConversationParams = {
	visitor?: { name: string; email: string };
	message?: string;
	isOffline?: boolean;
	department?: string;
	waitForChatStart?: boolean;
};

export class OmnichannelLiveChat {
	readonly page: Page;

	readonly root: Page | FrameLocator;

	constructor(
		page: Page,
		private readonly api: { get(url: string): Promise<APIResponse> },
		root?: Page | FrameLocator,
	) {
		this.page = page;
		this.root = root || page;
	}

	btnOpenOnlineLiveChat(label: string): Locator {
		return this.root.locator(`role=button[name="${label}"]`);
	}

	get btnOpenLiveChat(): Locator {
		return this.root.locator(`[data-qa-id="chat-button"]`);
	}

	get btnNewChat(): Locator {
		return this.root.locator(`role=button[name="New Chat"]`);
	}

	get btnOptions(): Locator {
		return this.root.locator(`button >> text="Options"`);
	}

	get btnCloseChat(): Locator {
		return this.root.locator(`button >> text="Finish this chat"`);
	}

	get btnChangeDepartment(): Locator {
		return this.root.locator(`button >> text="Change department"`);
	}

	get btnCloseChatConfirm(): Locator {
		return this.root.locator(`button >> text="Yes"`);
	}

	get txtHeaderTitle(): Locator {
		return this.root.locator('div >> text="Chat Finished"');
	}

	get btnChatNow(): Locator {
		return this.root.locator('[type="button"] >> text="Chat now"');
	}

	get headerTitle(): Locator {
		return this.root.locator('[data-qa="header-title"]');
	}

	get txtWatermark(): Locator {
		return this.root.locator('[data-qa="livechat-watermark"]');
	}

	get imgLogo(): Locator {
		return this.btnOpenLiveChat.locator('img[alt="Livechat"]');
	}

	alertMessage(message: string): Locator {
		return this.root.getByRole('alert').locator(`text="${message}"`);
	}

	txtChatMessage(message: string): Locator {
		return this.root.locator(`[data-qa="message-bubble"]`, { hasText: new RegExp(`^${message}$`) });
	}

	async closeChat(): Promise<void> {
		await this.btnOptions.click();
		await this.btnCloseChat.click();
		await this.btnCloseChatConfirm.click();
		await this.btnNewChat.waitFor({ state: 'visible' });
	}

	async openLiveChat(): Promise<void> {
		const { value: siteName } = await (await this.api.get('/settings/Livechat_title')).json();
		await this.btnOpenOnlineLiveChat(siteName).click();
	}

	async startChat(params: LivechatConversationParams = {}): Promise<{ visitor: { name: string; email: string }; message: string }> {
		const {
			visitor = createFakeVisitor(),
			message = faker.lorem.sentence(),
			isOffline = false,
			department,
			waitForChatStart = true,
		} = params;

		await this.btnOpenLiveChat.click();
		await this.registerVisitor(visitor, isOffline, department);

		if (!isOffline) {
			await this.inputComposer.fill(message);
			await this.btnSendMessageToOnlineAgent.click();

			if (waitForChatStart) {
				await this.txtChatMessage(message).waitFor({ state: 'visible' });
				await this.txtChatMessage('Chat started').waitFor({ state: 'visible' });
			}
		}

		return { visitor, message };
	}

	unreadMessagesBadge(count: number): Locator {
		const name = count === 1 ? `${count} unread message` : `${count} unread messages`;

		return this.root.locator(`role=status[name="${name}"]`);
	}

	get inputName(): Locator {
		return this.root.locator('[name="name"]');
	}

	get inputEmail(): Locator {
		return this.root.locator('[name="email"]');
	}

	get selectDepartment(): Locator {
		return this.root.locator('[name="department"]');
	}

	get textAreaMessage(): Locator {
		return this.root.locator('[name="message"]');
	}

	btnSendMessage(btnText: string): Locator {
		return this.root.locator(`role=button[name="${btnText}"]`);
	}

	get btnOk(): Locator {
		return this.root.locator('role=button[name="OK"]');
	}

	get btnYes(): Locator {
		return this.root.locator('role=button[name="Yes"]');
	}

	get inputComposer(): Locator {
		return this.root.locator('[data-qa="livechat-composer"]');
	}

	get btnSendMessageToOnlineAgent(): Locator {
		return this.root.locator('footer div div div:nth-child(3) button');
	}

	get btnStartChat(): Locator {
		return this.root.locator('role=button', { hasText: 'Start chat' });
	}

	get livechatModal(): Locator {
		return this.root.locator('[data-qa-type="modal-overlay"]');
	}

	get btnFinishOfflineMessage(): Locator {
		return this.root.locator(`button[aria-label="OK"]`);
	}

	livechatModalText(text: string): Locator {
		return this.root.locator(`[data-qa-type="modal-overlay"] >> text=${text}`);
	}

	get fileUploadTarget(): Locator {
		return this.root.locator('#files-drop-target');
	}

	findUploadedFileLink(fileName: string): Locator {
		return this.root.getByRole('link', { name: fileName });
	}

	public async registerVisitor(visitor: { name: string; email: string }, isOffline = false, department?: string): Promise<void> {
		const buttonLabel = isOffline ? 'Send' : 'Start chat';
		await this.inputName.fill(visitor.name);
		await this.inputEmail.fill(visitor.email);

		if (department) {
			await this.selectDepartment.selectOption({ label: department });
		}

		if (isOffline) {
			await this.textAreaMessage.fill('any_message');
			await this.btnSendMessage(buttonLabel).click();
			return this.btnFinishOfflineMessage.click();
		}

		await this.btnSendMessage(buttonLabel).click();
		await this.inputComposer.waitFor({ state: 'visible' });
	}

	public async startAndCloseChat(visitor?: { name: string; email: string }, message = 'this_a_test_message_from_user'): Promise<void> {
		await this.startChat({ visitor, message });
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

	queuePosition(position: number): Locator {
		return this.root.locator(`div[role='alert'] >> text=Your spot is #${position}`);
	}

	imgAvatar(username: string): Locator {
		return this.root.locator(`img[alt="${username}"]`).last();
	}

	get messageList(): Locator {
		return this.root.locator('[data-qa="message-list"]');
	}

	get messageListBackground(): Promise<string> {
		return this.messageList.evaluate((el) => window.getComputedStyle(el).getPropertyValue('background-color'));
	}

	async sendMessage(message: string): Promise<void> {
		await this.inputComposer.fill(message);
		await this.btnSendMessageToOnlineAgent.click();
	}

	messageBubbleBackground(message: string): Promise<string> {
		return this.txtChatMessage(message)
			.last()
			.evaluate((el) => window.getComputedStyle(el).getPropertyValue('background-color'));
	}
}
