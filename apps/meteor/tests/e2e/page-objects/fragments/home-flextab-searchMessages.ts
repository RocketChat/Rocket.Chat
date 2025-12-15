import type { Locator, Page } from '@playwright/test';

export class HomeFlextabSearchMessages {
	readonly searchTab: Locator;

	constructor(protected page: Page) {
		this.searchTab = this.page.getByRole('dialog', { name: 'Search Messages' });
	}

	async search(text: string, { global = false, timeout }: { global?: boolean; timeout?: number } = {}) {
		if (global) {
			await this.searchTab.getByText('Global search').click({ timeout });
		}
		await this.searchTab.getByPlaceholder('Search Messages').fill(text, { timeout });
	}

	async getResultItem(messageText: string) {
		return this.searchTab.getByRole('listitem', { name: messageText });
	}
}
