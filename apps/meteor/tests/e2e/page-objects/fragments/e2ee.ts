import type { Locator, Page } from '@playwright/test';

import { Navbar } from './navbar';
import { resolvePrivateRoomId } from '../../utils/resolve-room-id';
import { expect } from '../../utils/test';

abstract class E2EEBanner {
	constructor(protected root: Locator) {}

	click() {
		return this.root.click();
	}

	async waitForDisappearance() {
		await expect(this.root).not.toBeVisible();
	}
}

export class SaveE2EEPasswordBanner extends E2EEBanner {
	constructor(page: Page) {
		super(page.getByRole('button', { name: 'Save your new E2EE password' }));
	}
}

export class EnterE2EEPasswordBanner extends E2EEBanner {
	constructor(page: Page) {
		// TODO: there is a typo in the default translation
		super(page.getByRole('button', { name: 'Enter your E2E password' }));
	}
}

export class E2EEKeyDecodeFailureBanner extends E2EEBanner {
	constructor(page: Page) {
		super(page.getByRole('button', { name: "Wasn't possible to decode your encryption key to be imported." }));
	}

	async expectToNotBeVisible() {
		await expect(this.root).not.toBeVisible();
	}
}

export class CreateE2EEChannel {
	private readonly navbar: Navbar;

	constructor(private readonly page: Page) {
		this.navbar = new Navbar(page);
	}

	async create(name: string): Promise<string> {
		await this.navbar.createEncryptedChannel(name);
		return this.resolve(name);
	}

	async createAndStore(name: string, createdChannels: { name: string; id?: string | null }[]): Promise<string> {
		const id = await this.create(name);
		createdChannels.push({ name, id });
		return id;
	}

	async resolveAndStore(name: string, createdChannels: { name: string; id?: string | null }[]): Promise<string> {
		const id = await this.resolve(name);
		createdChannels.push({ name, id });
		return id;
	}

	private async resolve(name: string): Promise<string> {
		const id = await resolvePrivateRoomId(this.page, name);
		await expect(id, `Failed to resolve roomId for ${name}`).toBeTruthy();
		return id || '';
	}
}
