import type { Locator, Page } from '@playwright/test';

import { Account, AccountSectionsHref } from './account';
import { PasskeyDetailsFlexTab } from './fragments/flextabs';
import { EnterPasswordModal } from './fragments/modals';
import { expect } from '../utils/test';

export class AccountPasskeys extends Account {
	protected readonly route = AccountSectionsHref.passkeys;

	protected readonly title = 'Passkeys';

	readonly details: PasskeyDetailsFlexTab;

	private readonly enterPasswordModal: EnterPasswordModal;

	constructor(page: Page) {
		super(page);
		this.details = new PasskeyDetailsFlexTab(page);
		this.enterPasswordModal = new EnterPasswordModal(page);
	}

	get btnAddPasskey(): Locator {
		return this.pageContent.getByRole('button', { name: 'Add passkey', exact: true });
	}

	get textNoPasskeys(): Locator {
		return this.pageContent.getByText('No passkeys yet');
	}

	getPasskeyRow(name: string): Locator {
		return this.pageContent.getByRole('table', { name: 'Passkeys' }).getByRole('row', { name, exact: true });
	}

	async addPasskey(name: string, password: string) {
		await this.btnAddPasskey.click();
		await this.enterPasswordModal.enterPassword(password);
		await this.namePasskey('Passkey added', name);
	}

	async openPasskey(name: string) {
		await this.getPasskeyRow(name).click();
		await this.details.waitForDisplay();
	}

	async renamePasskey(currentName: string, name: string) {
		await this.openPasskey(currentName);
		await this.details.btnRename.click();
		await this.namePasskey('Rename passkey', name);
	}

	async removePasskey(name: string) {
		await this.openPasskey(name);
		await this.details.btnRemove.click();

		const dialog = this.page.getByRole('dialog', { name: 'Remove passkey' });
		await dialog.getByRole('button', { name: 'Remove', exact: true }).click();
		await expect(dialog).not.toBeVisible();
		await this.details.waitForDismissal();
		await expect(this.getPasskeyRow(name)).not.toBeVisible();
	}

	private async namePasskey(dialogTitle: string, name: string) {
		const dialog = this.page.getByRole('dialog', { name: dialogTitle });
		await dialog.getByRole('textbox', { name: 'Passkey name' }).fill(name);
		await dialog.getByRole('button', { name: 'Save', exact: true }).click();
		await expect(dialog).not.toBeVisible();
		await expect(this.getPasskeyRow(name)).toBeVisible();
	}
}
