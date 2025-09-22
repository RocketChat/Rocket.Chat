import type { Locator, Page } from '@playwright/test';

import { expect } from '../../utils/test';

export class PinnedMessagesTab {
	private readonly root: Locator;

	constructor(page: Page) {
		this.root = page.getByRole('dialog', { name: 'Pinned Messages' });
	}

	private get lastMessage(): Locator {
		return this.root.locator('[data-qa-type="message"]').last();
	}

	private getMessageMoreButton(messageLocator: Locator): Locator {
		return messageLocator.getByRole('button', { name: 'More' });
	}

	async expectToBeVisible(): Promise<void> {
		await expect(this.root).toBeVisible();
	}

	async expectLastMessageToContainText(text: string): Promise<void> {
		await expect(this.lastMessage).toContainText(text);
	}

	async openLastMessageMenu(): Promise<void> {
		await this.lastMessage.hover();
		await this.getMessageMoreButton(this.lastMessage).waitFor();
		await this.getMessageMoreButton(this.lastMessage).click();
	}
}
