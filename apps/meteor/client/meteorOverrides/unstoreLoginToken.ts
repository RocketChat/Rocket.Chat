import { Accounts } from 'meteor/accounts-base';

import { CachedCollectionManager } from '../lib/cachedCollections';

const { _unstoreLoginToken } = Accounts;
Accounts._unstoreLoginToken = (...args) => {
	_unstoreLoginToken.apply(Accounts, args);
	CachedCollectionManager.clearAllCachesOnLogout();
};
