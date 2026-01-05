import type { Page } from '@playwright/test';
import type { TranslationKey } from '@rocket.chat/ui-contexts';

import { AccountSidebar, ToastMessages } from './fragments';

export abstract class Account {
	readonly toastMessage: ToastMessages;

	readonly sidebar: AccountSidebar;

	readonly page: Page;

	readonly t: (key: TranslationKey) => string;

	constructor(page: Page, t: (key: TranslationKey) => string = (key) => key) {
		this.toastMessage = new ToastMessages(page);
		this.sidebar = new AccountSidebar(page);
		this.page = page;
		this.t = t;
	}

	protected get saveChangesButton() {
		return this.page.getByRole('button', { name: this.t('Save_changes') });
	}
}
