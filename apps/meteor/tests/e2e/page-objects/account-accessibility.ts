import type { Locator } from '@playwright/test';

import { Account, AccountSectionsHref } from './account';

export class AccountAccessibility extends Account {
	protected readonly route = AccountSectionsHref.accessibilityAndAppearance;

	protected readonly title = 'Accessibility & appearance';

	get btnCancel(): Locator {
		return this.page.getByRole('button', { name: 'Cancel', exact: true });
	}

	radioTheme(id: string): Locator {
		return this.page.locator(`input#${id}`);
	}

	paletteStyleTag(theme: string): Locator {
		return this.page.locator(`#main-palette-${theme}`);
	}
}
