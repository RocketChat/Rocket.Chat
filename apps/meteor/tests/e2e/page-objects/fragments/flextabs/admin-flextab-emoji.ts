import type { Page } from '@playwright/test';

import { FlexTab } from './flextab';

export class AddEmojiFlexTab extends FlexTab {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Add New Emoji' }));
	}
}

export class EditEmojiFlexTab extends FlexTab {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Custom Emoji Info' }));
	}

	async delete() {
		await this.btnDelete.click();
	}
}
