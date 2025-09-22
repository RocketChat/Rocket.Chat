import type { Locator, Page } from '@playwright/test';

import { Message } from './message';
import { expect } from '../../utils/test';

export class StarredMessagesTab {
	private readonly root: Locator;

	constructor(page: Page) {
		this.root = page.getByRole('dialog', { name: 'Starred Messages' });
	}

	private get lastMessage(): Message {
		return new Message(this.root.locator('[data-qa-type="message"]').last());
	}

	async expectToBeVisible(): Promise<void> {
		await expect(this.root).toBeVisible();
	}

	async expectLastMessageToContainText(text: string): Promise<void> {
		await expect(this.lastMessage.root).toContainText(text);
	}

	async openLastMessageMenu(): Promise<void> {
		await this.lastMessage.openMenu();
	}
}
