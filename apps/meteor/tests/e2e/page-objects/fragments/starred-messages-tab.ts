import type { Locator, Page } from '@playwright/test';

import { expect } from '../../utils/test';

export class StarredMessagesTab {
	private readonly root: Locator;

	constructor(page: Page) {
		this.root = page.getByRole('dialog', { name: 'Starred Messages' });
	}

	private get lastMessage(): Locator {
		return this.root.locator('[data-qa-type="message"]').last();
	}

	async expectToBeVisible(): Promise<void> {
		await expect(this.root).toBeVisible();
	}

	async expectLastMessageToContainText(text: string): Promise<void> {
		await expect(this.lastMessage).toContainText(text);
	}
}
