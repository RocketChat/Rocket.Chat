import type { Locator, Page } from '@playwright/test';
import type { TranslationKey } from '@rocket.chat/ui-contexts';

import { Account } from './account';

export class AccountPreferences extends Account {
	constructor(page: Page, t: (key: TranslationKey) => string) {
		super(page, t);
	}

	get languageSelect(): Locator {
		return this.page.getByRole('button', { name: this.t('Language') });
	}

	get hiddenLanguageSelect(): Locator {
		return this.languageSelect.locator('select');
	}
}
