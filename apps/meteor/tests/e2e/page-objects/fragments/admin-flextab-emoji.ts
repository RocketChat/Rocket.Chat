import type { Locator, Page } from '@playwright/test';

import { FlexTab } from './flextab';

abstract class EmojiFlexTab extends FlexTab {
	constructor(root: Locator) {
		super(root);
	}

	async save() {
		await this.btnSave.click();
		await this.waitForDismissal();
	}
}

export class AddEmojiFlexTab extends EmojiFlexTab {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Add New Emoji' }));
	}
}

export class EditEmojiFlexTab extends EmojiFlexTab {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Custom Emoji Info' }));
	}

	async delete() {
		await this.btnDelete.click();
	}
}
