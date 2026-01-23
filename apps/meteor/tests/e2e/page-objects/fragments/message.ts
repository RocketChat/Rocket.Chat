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
}
