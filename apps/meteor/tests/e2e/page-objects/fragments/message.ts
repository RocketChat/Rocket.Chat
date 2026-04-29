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

	get moreButton() {
		return this.root.getByRole('button', { name: 'More' });
	}

	async openMenu(): Promise<void> {
		await this.root.hover();
		await this.moreButton.waitFor();
		await this.moreButton.click();
	}
}
