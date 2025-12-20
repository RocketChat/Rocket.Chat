import type { Locator, Page } from '@playwright/test';

import { Listbox } from './fragments/listbox';
import { Modal } from './fragments/modal';

export class CreateNewModal extends Modal {
	readonly listbox: Locator;

	constructor(root: Locator, page: Page) {
		super(root, page);
		this.listbox = new Listbox(page).root;
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

	async addMember(memberName: string): Promise<void> {
		await this.root.getByRole('textbox', { name: 'Add people' }).click();
		await this.root.getByRole('textbox', { name: 'Add people' }).fill(memberName, { force: true });
		await this.listbox.getByRole('option', { name: memberName }).click();
		await this.root.getByRole('textbox', { name: 'Add people' }).click();
	}
}

export class CreateNewChannelModal extends CreateNewModal {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Create channel' }), page);
	}

	get advancedSettingsAccordion(): Locator {
		return this.root.getByRole('button', { name: 'Advanced settings', exact: true });
	}

	// TODO: improve locator
	get autocompleteUser(): Locator {
		return this.root.locator('//*[@id="modal-root"]//*[contains(@class, "rcx-box--full") and contains(text(), "Add Members")]/..//input');
	}

	async inviteUserToChannel(username: string) {
		await this.autocompleteUser.click();
		await this.autocompleteUser.type(username);
		await this.root.locator('[data-qa-type="autocomplete-user-option"]', { hasText: username }).waitFor();
		await this.root.locator('[data-qa-type="autocomplete-user-option"]', { hasText: username }).click();
	}
}

export class CreateNewDMModal extends CreateNewModal {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'New direct message' }), page);
	}

	get dmListbox(): Locator {
		return this.root.getByRole('listbox');
	}

	get autocompleteUser(): Locator {
		return this.root.locator('//*[@id="modal-root"]//*[contains(@class, "rcx-box--full")]/..//input');
	}

	async inviteUserToDM(username: string) {
		await this.autocompleteUser.click();
		await this.autocompleteUser.type(username);
		await this.root.locator('[data-qa-type="autocomplete-user-option"]', { hasText: username }).waitFor();
		await this.root.locator('[data-qa-type="autocomplete-user-option"]', { hasText: username }).click();
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
		return this.listbox.getByRole('option', { name });
	}

	get inputMessage(): Locator {
		return this.root.getByRole('textbox', { name: 'Message', exact: true });
	}
}
