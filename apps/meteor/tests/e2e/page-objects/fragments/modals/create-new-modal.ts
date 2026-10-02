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
		return this.root.getByRole('button', { name: 'Create', exact: true });
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

	async create() {
		await this.btnCreate.click();
		await this.waitForDismissal();
	}
}

export class CreateNewChannelModal extends CreateNewModal {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Create channel' }), page);
	}

	get advancedSettingsAccordion(): Locator {
		return this.root.getByRole('button', { name: 'Advanced settings', exact: true });
	}

	get checkboxAbacManaged(): Locator {
		return this.root.locator('label', { hasText: 'ABAC Managed' });
	}

	get btnNext(): Locator {
		return this.root.getByRole('button', { name: 'Next', exact: true });
	}

	getStepIndicator(step: number, total: number): Locator {
		return this.root.getByText(`Step ${step} of ${total}`);
	}

	async selectAttribute(key: string, values: string[]) {
		await this.root.getByPlaceholder('Search attribute').last().click();
		await this.listbox.selectOption(key, true);
		await this.root.getByPlaceholder('Select attribute values').last().click();
		for (const value of values) {
			await this.listbox.selectOption(value, true);
		}
		await this.page?.keyboard.press('Escape');
	}

	getPreviewGroup(name: 'Compliant' | 'Non-compliant'): Locator {
		return this.root.getByRole('region', { name, exact: true });
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

export class CreateNewCategoryModal extends CreateNewModal {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Create category', exact: true }), page);
	}

	private get btnCreateAndMove() {
		return this.root.getByRole('button', { name: 'Create and move', exact: true });
	}

	override async create(hasRoom = false) {
		await (hasRoom ? this.btnCreateAndMove.click() : this.btnCreate.click());
		await this.waitForDismissal();
	}
}
