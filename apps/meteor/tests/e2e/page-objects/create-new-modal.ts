import type { Locator, Page } from '@playwright/test';

import { Modal } from './fragments/modal';

export class CreateNewModal extends Modal {
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

	get dmListbox(): Locator {
		return this.root.getByRole('listbox');
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
	private readonly listbox: Listbox;

	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Create discussion' }));
		this.listbox = new Listbox(page);
	}

	get inputParentRoom(): Locator {
		return this.root.getByRole('textbox', { name: 'Parent channel or team' });
	}

	getParentRoomListItem(name: string): Locator {
		return this.listbox.root.getByRole('option', { name });
	}

	get inputMessage(): Locator {
		return this.root.getByRole('textbox', { name: 'Message', exact: true });
	}
}

export class Listbox {
	readonly root: Locator;

	constructor(page: Page) {
		this.root = page.getByRole('listbox');
	}
}
