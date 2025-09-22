import type { Locator } from '@playwright/test';

export class Message {
	constructor(public readonly root: Locator) {}

	get body() {
		return this.root.locator('[data-qa-type="message-body"]');
	}

	get fileUploadName() {
		return this.root.locator('[data-qa-type="attachment-title-link"]');
	}

	get encryptedIcon() {
		return this.root.locator('.rcx-icon--name-key');
	}

	get moreButton() {
		return this.root.getByRole('button', { name: 'More' });
	}

	async openMenu(): Promise<void> {
		await this.root.hover();
		await this.moreButton.waitFor();
		await this.moreButton.click();
	}
}
