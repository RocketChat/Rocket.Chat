import type { Locator, Page } from '@playwright/test';

import { Modal } from './fragments/modal';

export class CreateNewModal extends Modal {
	get inputName(): Locator {
		return this.root.getByRole('textbox', { name: 'Name' });
	}

	get checkboxEncrypted(): Locator {
		return this.root.locator('label', { has: this.root.getByRole('checkbox', { name: 'Encrypted' }) });
	}

	get btnCreate(): Locator {
		return this.root.getByRole('button', { name: 'Create' });
	}
}

export class CreateNewChannelModal extends CreateNewModal {
	constructor(root: Page) {
		super(root.getByRole('dialog', { name: 'Create channel' }));
	}

	get advancedSettingsAccordion(): Locator {
		return this.root.getByRole('button', { name: 'Advanced settings', exact: true });
	}
}

export class CreateNewDMModal extends CreateNewModal {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'New direct message' }));
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
