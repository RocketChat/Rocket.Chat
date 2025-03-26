import type { Locator, Page } from '@playwright/test';

export class OmnichannelRoomInfo {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get dialogRoomInfo(): Locator {
		return this.page.getByRole('dialog', { name: 'Room Information' });
	}

	get btnEditRoomInfo(): Locator {
		return this.dialogRoomInfo.getByRole('button', { name: 'Edit' });
	}

	get dialogEditRoom(): Locator {
		return this.page.getByRole('dialog', { name: 'Edit Room' });
	}

	get inputTopic(): Locator {
		return this.dialogEditRoom.getByRole('textbox', { name: 'Topic' });
	}

	get btnSaveEditRoom(): Locator {
		return this.dialogEditRoom.getByRole('button', { name: 'Save' });
	}

	getInfo(value: string): Locator {
		return this.page.locator(`span >> text="${value}"`);
	}

	getLabel(label: string): Locator {
		return this.page.locator(`div >> text="${label}"`);
	}
}
