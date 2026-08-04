import type { Page } from '@playwright/test';

import { FlexTab } from './flextab';

export class SearchMessagesFlexTab extends FlexTab {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Search Messages' }));
	}

	async search(text: string, { global = false }: { global?: boolean } = {}) {
		if (global) {
			await this.root.getByText('Global search').click();
		}
		await this.root.getByPlaceholder('Search Messages').fill(text);
	}

	async getResultItem(messageText: string) {
		return this.root.getByRole('listitem', { name: messageText });
	}
}
