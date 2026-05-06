import { Emitter } from '@rocket.chat/emitter';

import { getDdpSdk } from './ddpSdk';
import { CachedStoresManager } from '../cachedStores/CachedStoresManager';

const emitter = new Emitter<{ beforeClear: void }>();

/**
 * Subscribe to credential-clear events. Fires before each
 * `clearStoredCredentials()` (whether triggered by us, by force-logout,
 * or by Meteor's own logout flow via the `unstoreLoginToken.ts`
 * override). Returns the unsubscribe function.
 */
export const onBeforeClearCredentials = (cb: () => void): (() => void) => emitter.on('beforeClear', cb);

/**
 * Mirror of `Accounts._unstoreLoginToken()` plus the
 * `client/meteor/overrides/unstoreLoginToken.ts` cache-flush hook.
 * Drops the local credential trio (`Meteor.loginToken`,
 * `Meteor.loginTokenExpires`, `Meteor.userId`) via `sdk.account.storage`
 * and clears the cached per-user stores so a relog into a different
 * account doesn't show stale data.
 */
export const clearStoredCredentials = (): void => {
	emitter.emit('beforeClear', undefined);
	getDdpSdk().account.storage.clear();
	CachedStoresManager.clearAllCachesOnLogout();
};
