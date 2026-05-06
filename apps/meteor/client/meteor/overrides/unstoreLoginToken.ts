import { Accounts } from 'meteor/accounts-base';

import { clearStoredCredentials } from '../../lib/sdk/storedCredentials';

// Bridge Meteor's internal `_unstoreLoginToken` (called by Meteor's logout
// flow + token-rotation paths) to our local `clearStoredCredentials` helper
// so per-user caches are flushed and `onBeforeClearCredentials` subscribers
// fire regardless of which path triggered the credential drop.
const { _unstoreLoginToken } = Accounts;
Accounts._unstoreLoginToken = (...args) => {
	_unstoreLoginToken.apply(Accounts, args);
	clearStoredCredentials();
};
