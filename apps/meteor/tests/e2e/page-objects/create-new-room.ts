import type { Locator, Page } from '@playwright/test';

import { Navbar } from './fragments';

export class CreateNewRoom {
	protected readonly page: Page;

	protected readonly navbar: Navbar;

	protected readonly type: 'Channel' | 'Team' | 'Direct message' | 'Discussion';

	constructor(page: Page, type: 'Channel' | 'Team' | 'Direct message' | 'Discussion') {
		this.page = page;
		this.navbar = new Navbar(page);
		this.type = type;
	}

	get dialogCreateNew(): Locator {
		return this.page.getByRole('dialog', {
			name: this.type === 'Direct message' ? `New ${this.type.toLocaleLowerCase()}` : `Create ${this.type.toLocaleLowerCase()}`,
		});
	}

	get inputName(): Locator {
		return this.dialogCreateNew.getByRole('textbox', { name: 'Name' });
	}

	get checkboxEncrypted(): Locator {
		return this.dialogCreateNew.locator('label', { has: this.page.getByRole('checkbox', { name: 'Encrypted' }) });
	}

	get btnCreate(): Locator {
		return this.dialogCreateNew.getByRole('button', { name: 'Create' });
	}

	async createNew(name: string): Promise<void> {
		await this.navbar.openCreate(this.type);
		await this.inputName.fill(name);
		await this.btnCreate.click();
	}
}

export class CreateNewChannel extends CreateNewRoom {
	constructor(page: Page) {
		super(page, 'Channel');
	}

	get advancedSettingsAccordion(): Locator {
		return this.dialogCreateNew.getByRole('button', { name: 'Advanced settings', exact: true });
	}

	async createEncrypted(name: string): Promise<void> {
		await this.navbar.openCreate('Channel');
		await this.inputName.fill(name);
		await this.advancedSettingsAccordion.click();
		await this.checkboxEncrypted.click();
		await this.btnCreate.click();
	}
}

export class CreateNewDM extends CreateNewRoom {
	constructor(page: Page) {
		super(page, 'Direct message');
	}
}

export class CreateNewTeam extends CreateNewRoom {
	constructor(page: Page) {
		super(page, 'Team');
	}
}

export class CreateNewDiscussion extends CreateNewRoom {
	constructor(page: Page) {
		super(page, 'Discussion');
	}
}
