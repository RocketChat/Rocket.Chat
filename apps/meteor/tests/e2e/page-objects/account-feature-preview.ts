import { Account, AccountSectionsHref } from './account';

export class AccountFeaturePreview extends Account {
	protected readonly route = AccountSectionsHref.featurePreview;

	protected readonly title = 'Feature preview';
}
