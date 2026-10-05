import type { Page } from '@playwright/test';

import { FlexTab } from './flextab';

export class AddEmojiFlexTab extends FlexTab {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Add new emoji' }));
	}
}

export class EditEmojiFlexTab extends FlexTab {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Custom emoji info' }));
	}

	async delete() {
		await this.btnDelete.click();
	}
}
