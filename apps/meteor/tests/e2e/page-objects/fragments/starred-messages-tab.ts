import type { Locator, Page } from '@playwright/test';

import { Message } from './message';
import { RoomToolbar } from './toolbar';
import { expect } from '../../utils/test';

export class StarredMessagesTab {
	private readonly root: Locator;

	private readonly roomToolbar: RoomToolbar;

	constructor(page: Page) {
		this.root = page.getByRole('dialog', { name: 'Starred Messages' });
		this.roomToolbar = new RoomToolbar(page);
	}

	private get lastMessage(): Message {
		return new Message(this.root.locator('[data-qa-type="message"]').last());
	}

	async openTab(): Promise<void> {
		await this.roomToolbar.openMoreOptions();
		await this.roomToolbar.menuItemStarredMessages.click();
		await expect(this.root).toBeVisible();
	}

	async expectLastMessageToContainText(text: string): Promise<void> {
		await expect(this.lastMessage.root).toContainText(text);
	}

	async openLastMessageMenu(): Promise<void> {
		await this.lastMessage.openMenu();
	}
}
