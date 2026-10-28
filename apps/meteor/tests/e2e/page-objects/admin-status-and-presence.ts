import type { Locator, Page } from '@playwright/test';

import { Admin, AdminSectionsHref } from './admin';
import { Listbox } from './fragments/listbox';

export class AdminStatusAndPresence extends Admin {
	readonly listbox: Listbox;

	constructor(page: Page) {
		super(page);
		this.listbox = new Listbox(page);
	}

	protected readonly route = AdminSectionsHref.userStatus;

	protected readonly title = 'Status and presence';

	get managedUsersTab(): Locator {
		return this.page.getByRole('tab', { name: 'Managed users', exact: true });
	}

	get editor(): Locator {
		return this.page.getByRole('dialog', { name: 'Manage user status' });
	}

	async openManagedUsersTab(): Promise<void> {
		await this.managedUsersTab.click();
	}

	async openEditor(): Promise<void> {
		await this.page.getByRole('button', { name: 'Manage user status', exact: true }).click();
		await this.editor.waitFor({ state: 'visible' });
	}

	rowOf(name: string): Locator {
		return this.page.locator('tr', { hasText: name }).first();
	}
}
