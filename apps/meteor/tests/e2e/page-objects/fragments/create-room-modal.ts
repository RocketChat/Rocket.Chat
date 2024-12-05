import type { Locator, Page } from '@playwright/test';

export class CreateRoomModal {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get modalRoot(): Locator {
		return this.page.locator('#modal-root');
	}

	getModalByRoomType(roomType: 'channel' | 'team' | 'direct message' | 'discussion'): Locator {
		if (roomType === 'channel' || roomType === 'team') {
			return this.modalRoot.getByRole('dialog', { name: `Create ${roomType}`, exact: true });
		}
		if (roomType === 'direct message') {
			return this.modalRoot.getByRole('dialog', { name: `New ${roomType}`, exact: true });
		}
		// TODO: Add discussion form id labelledby
		return this.modalRoot.getByRole('dialog');
	}

	get inputChannelName(): Locator {
		return this.getModalByRoomType('channel').getByRole('textbox', { name: 'Name' });
	}

	get inputTeamName(): Locator {
		return this.getModalByRoomType('team').getByRole('textbox', { name: 'Name' });
	}

	get inputDirectUsernames(): Locator {
		return this.getModalByRoomType('direct message').getByRole('textbox');
	}

	get advancedSettingsAccordion(): Locator {
		return this.modalRoot.getByRole('dialog').getByRole('button', { name: 'Advanced settings', exact: true });
	}

	getCheckboxByLabel(label: string): Locator {
		return this.modalRoot.locator('label', { has: this.page.getByRole('checkbox', { name: label }) });
	}

	get checkboxPrivate(): Locator {
		return this.getCheckboxByLabel('Private');
	}

	get checkboxEncryption(): Locator {
		return this.getCheckboxByLabel('Encrypted');
	}

	get checkboxReadOnly(): Locator {
		return this.getCheckboxByLabel('Read-only');
	}

	get btnCreate(): Locator {
		return this.modalRoot.getByRole('button', { name: 'Create' });
	}
}
