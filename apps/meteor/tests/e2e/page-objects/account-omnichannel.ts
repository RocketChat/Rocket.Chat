import { Account, AccountSectionsHref } from './account';

export class AccountOmnichannel extends Account {
	protected readonly route = AccountSectionsHref.omnichannel;

	protected readonly title = 'Omnichannel';
}
