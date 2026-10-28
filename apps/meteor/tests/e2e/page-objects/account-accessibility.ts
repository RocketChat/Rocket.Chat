import { Account, AccountSectionsHref } from './account';

export class AccountAccessibility extends Account {
	protected readonly route = AccountSectionsHref.accessibilityAndAppearance;

	protected readonly title = 'Accessibility & appearance';
}
