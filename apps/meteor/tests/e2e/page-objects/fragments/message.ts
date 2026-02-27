import type { Locator } from '@playwright/test';

export class Message {
	constructor(public readonly root: Locator) {}

	get body() {
		return this.root.locator('[role="document"][aria-roledescription="message body"]');
	}

	getFileUploadByName(filename: string) {
		return this.root.getByRole('link', { name: filename });
	}

	get encryptedIcon() {
		return this.root.locator('.rcx-icon--name-key');
	}
}
