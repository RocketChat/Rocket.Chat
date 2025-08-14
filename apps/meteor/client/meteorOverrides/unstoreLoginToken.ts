import { Accounts } from 'meteor/accounts-base';

import { CachedStoresManager } from '../lib/cachedStores';

const { _unstoreLoginToken } = Accounts;
Accounts._unstoreLoginToken = (...args) => {
	_unstoreLoginToken.apply(Accounts, args);
	CachedStoresManager.clearAllCachesOnLogout();
};
