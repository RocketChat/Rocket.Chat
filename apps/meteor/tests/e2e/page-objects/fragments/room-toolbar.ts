import type { Locator, Page } from '@playwright/test';

export class RoomToolbar {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	private get toolbarPrimaryActions(): Locator {
		return this.page.getByRole('toolbar', { name: 'Primary Room actions' });
	}

	private get btnToolbarPrimaryActionsMore(): Locator {
		return this.toolbarPrimaryActions.getByRole('button', { name: 'Options' });
	}

	private get menuToolbarPrimaryActionsMore(): Locator {
		return this.page.getByRole('menu', { name: 'Options' });
	}

	private get optionPinnedMessages(): Locator {
		return this.menuToolbarPrimaryActionsMore.getByRole('menuitem', { name: 'Pinned Messages' });
	}

	private get optionStarredMessages(): Locator {
		return this.menuToolbarPrimaryActionsMore.getByRole('menuitem', { name: 'Starred Messages' });
	}

	async openPinnedMessagesList(): Promise<void> {
		await this.btnToolbarPrimaryActionsMore.click();
		await this.optionPinnedMessages.click();
	}

	async openStarredMessagesList(): Promise<void> {
		await this.btnToolbarPrimaryActionsMore.click();
		await this.optionStarredMessages.click();
	}
}
