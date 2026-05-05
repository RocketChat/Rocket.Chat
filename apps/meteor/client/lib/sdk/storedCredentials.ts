import { CachedStoresManager } from '../cachedStores/CachedStoresManager';

// Mirror of `Accounts._unstoreLoginToken()` plus the
// `client/meteor/overrides/unstoreLoginToken.ts` cache-flush hook.
// Drops the local credential trio (`Meteor.loginToken`,
// `Meteor.loginTokenExpires`, `Meteor.userId`) and clears the cached
// per-user stores so a relog into a different account doesn't show stale
// data.
//
// Keeps the same localStorage keys Meteor uses so consumers like
// `client/meteor/overrides/ddpOverREST.ts` (which reads
// `localStorage.getItem('Meteor.loginToken')` directly) stay in sync.
export const clearStoredCredentials = (): void => {
	if (typeof window !== 'undefined' && window.localStorage) {
		window.localStorage.removeItem('Meteor.loginToken');
		window.localStorage.removeItem('Meteor.loginTokenExpires');
		window.localStorage.removeItem('Meteor.userId');
	}
	CachedStoresManager.clearAllCachesOnLogout();
};
