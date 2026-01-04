import type { Locator, Page } from '@playwright/test';

import { Admin } from './admin';
import { AddEmojiFlexTab, EditEmojiFlexTab } from './fragments/admin-flextab-emoji';

export class AdminEmoji extends Admin {
	readonly addEmojiFlexTab: AddEmojiFlexTab;

	readonly editEmojiFlexTab: EditEmojiFlexTab;

	constructor(page: Page) {
		super(page);
		this.addEmojiFlexTab = new AddEmojiFlexTab(page);
		this.editEmojiFlexTab = new EditEmojiFlexTab(page);
	}

	private get inputSearch(): Locator {
		return this.page.getByRole('textbox', { name: 'Search' });
	}

	private get emojiTable() {
		return this.page.getByRole('table', { name: 'Emoji' });
	}

	async findEmojiByName(emojiName: string) {
		await this.inputSearch.fill(emojiName);
		return this.emojiTable.getByRole('link', { name: emojiName });
	}

	async deleteEmoji(emojiName: string) {
		await (await this.findEmojiByName(emojiName)).click();
		await this.editEmojiFlexTab.delete();
		await this.deleteModal.confirmDelete();
	}
}
