import type { Locator, Page } from '@playwright/test';

import { Modal } from './fragments/modal';

export class CreateNewModal extends Modal {
	get inputName(): Locator {
		return this.root.getByRole('textbox', { name: 'Name' });
	}

	get checkboxEncrypted(): Locator {
		return this.root.locator('label').filter({ has: this.root.getByRole('checkbox', { name: 'Encrypted' }) });
	}

	get checkboxFederated(): Locator {
		return this.root.locator('label', { hasText: 'Federated' });
	}

	get btnCreate(): Locator {
		return this.root.getByRole('button', { name: 'Create' });
	}

	async addMember(memberName: string): Promise<void> {
		await this.root.locator('role=textbox[name="Members"]').type(memberName, { delay: 100 });
		await this.root.locator(`.rcx-option__content:has-text("${memberName}")`).click();
	}
}

export class CreateNewChannelModal extends CreateNewModal {
	constructor(root: Page) {
		super(root.getByRole('dialog', { name: 'Create channel' }));
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
		super(page.getByRole('dialog', { name: 'New direct message' }));
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
		super(page.getByRole('dialog', { name: 'New team' }));
	}

	get advancedSettingsAccordion(): Locator {
		return this.root.getByRole('button', { name: 'Advanced settings', exact: true });
	}
}

export class CreateNewDiscussionModal extends CreateNewModal {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'New discussion' }));
	}
}
