import type { Locator } from '@playwright/test';

import { Account, AccountSectionsHref } from './account';

export class AccountTokens extends Account {
	protected readonly route = AccountSectionsHref.tokens;

	protected readonly title = 'Personal Access Tokens';

	get inputToken(): Locator {
		return this.page.locator('[data-qa="PersonalTokenField"]');
	}

	get tokensTableEmpty(): Locator {
		return this.page.locator('//h3[contains(text(), "No results found")]');
	}

	get btnTokensAdd(): Locator {
		return this.page.locator('role=button[name="Add"]');
	}

	get tokenAddedModal(): Locator {
		return this.page.locator('role=dialog[name="Personal Access Token successfully generated"]');
	}

	get btnTokenAddedOk(): Locator {
		return this.tokenAddedModal.locator('role=button[name="Ok"]');
	}

	get tokensRows(): Locator {
		return this.page.locator('table tbody tr');
	}

	tokenInTable(name: string): Locator {
		return this.page.locator(`tr[qa-token-name="${name}"]`);
	}

	get btnRegenerateTokenModal(): Locator {
		return this.page.locator('role=button[name="Regenerate token"]');
	}

	get removeTokenModal(): Locator {
		return this.page.locator('role=dialog', { hasText: 'personal access token' });
	}

	get btnRemoveTokenModal(): Locator {
		return this.removeTokenModal.getByRole('button', { name: 'Remove' });
	}
}
