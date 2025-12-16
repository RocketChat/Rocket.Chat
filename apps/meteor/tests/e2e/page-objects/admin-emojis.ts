import type { Locator, Page } from '@playwright/test';

import { AdminFlextabEmoji } from './fragments/admin-flextab-emoji';

export class AdminEmoji {
	private readonly page: Page;

	readonly addEmoji: AdminFlextabEmoji;

	constructor(page: Page) {
		this.page = page;
		this.addEmoji = new AdminFlextabEmoji(page);
	}

	get newButton(): Locator {
		return this.page.getByRole('button', { name: 'New' });
	}

	get closeAdminButton(): Locator {
		return this.page.getByRole('navigation').getByRole('button', { name: 'Close' });
	}

	get searchInput(): Locator {
		return this.page.getByRole('textbox', { name: 'Search' });
	}

	async findEmojiByName(emojiName: string): Promise<Locator> {
		await this.searchInput.fill(emojiName);
		return this.page.getByRole('link', { name: emojiName });
	}
}
