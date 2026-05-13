import type { Locator, Page } from '@playwright/test';

import { Listbox } from '../listbox';
import { Modal } from './modal';

export abstract class CreateNewModal extends Modal {
	readonly listbox: Listbox;

	constructor(root: Locator, page: Page) {
		super(root, page);
		this.listbox = new Listbox(page);
	}

	get inputName(): Locator {
		return this.root.getByRole('textbox', { name: 'Name' });
	}

	get checkboxPrivate(): Locator {
		return this.root.locator('label', { hasText: 'Private' });
	}

	get checkboxEncrypted(): Locator {
		return this.root.locator('label', { hasText: 'Encrypted' });
	}

	get checkboxReadOnly(): Locator {
		return this.root.locator('label', { hasText: 'Read-only' });
	}

	get checkboxFederated(): Locator {
		return this.root.locator('label', { hasText: 'Federated' });
	}

	get btnCreate(): Locator {
		return this.root.getByRole('button', { name: 'Create' });
	}

	get inputAddMembers(): Locator {
		return this.root.getByRole('combobox', { name: 'Members' });
	}

	async addMember(memberName: string): Promise<void> {
		await this.inputAddMembers.click();
		await this.inputAddMembers.fill(memberName, { force: true });
		await this.listbox.selectOption(memberName);
		await this.inputAddMembers.click();
	}
}

export class CreateNewChannelModal extends CreateNewModal {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Create channel' }), page);
	}

	get advancedSettingsAccordion(): Locator {
		return this.root.getByRole('button', { name: 'Advanced settings', exact: true });
	}

	async inviteUserToChannel(username: string) {
		await this.inputAddMembers.click();
		await this.inputAddMembers.fill(username);
		await this.listbox.selectOption(username);
	}
}

export class CreateNewDMModal extends CreateNewModal {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'New direct message' }), page);
	}

	get autocompleteUser(): Locator {
		return this.root.getByRole('combobox', { name: 'Select one or more people to message', exact: true });
	}

	async inviteUserToDM(username: string) {
		await this.autocompleteUser.click();
		await this.autocompleteUser.fill(username);
		await this.listbox.selectOption(username);
		await this.page?.keyboard.press('Tab');
	}
}

export class CreateNewTeamModal extends CreateNewModal {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Create team' }), page);
	}

	get advancedSettingsAccordion(): Locator {
		return this.root.getByRole('button', { name: 'Advanced settings', exact: true });
	}
}

export class CreateNewDiscussionModal extends CreateNewModal {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Create discussion' }), page);
	}

	get inputParentRoom(): Locator {
		return this.root.getByRole('textbox', { name: 'Parent channel or team' });
	}

	getParentRoomListItem(name: string): Locator {
		return this.listbox.getOption(name);
	}

	get inputMessage(): Locator {
		return this.root.getByRole('textbox', { name: 'Message', exact: true });
	}
}
