import type { Locator, Page } from '@playwright/test';

import { AccountSidebar, ToastMessages } from './fragments';

export abstract class Account {
	readonly toastMessage: ToastMessages;

	readonly sidebar: AccountSidebar;

	constructor(protected page: Page) {
		this.toastMessage = new ToastMessages(page);
		this.sidebar = new AccountSidebar(page);
	}

	protected async gotoRoute(path: string, readyLocator: Locator): Promise<void> {
		await this.page.goto(path);
		await readyLocator.waitFor({ state: 'visible' });
	}

	protected get saveChangesButton() {
		return this.page.getByRole('button', { name: 'Save changes' });
	}
}
