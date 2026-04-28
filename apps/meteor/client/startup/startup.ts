import type { UserStatus } from '@rocket.chat/core-typings';
import { Accounts } from 'meteor/accounts-base';

import 'highlight.js/styles/github.css';
import { sdk } from '../../app/utils/client/lib/SDKClient';
import { onLoggedIn } from '../lib/loggedIn';
import { ensureConnectedAndAuthenticated } from '../lib/sdk/ddpSdk';
import { userIdStore } from '../lib/user';
import { removeLocalUserData, synchronizeUserData } from '../lib/userData';
import { fireGlobalEvent } from '../lib/utils/fireGlobalEvent';
import { Users } from '../stores';

let status: UserStatus | undefined = undefined;

const emitStatusChange = (next: UserStatus | undefined) => {
	if (next === status) return;
	status = next;
	fireGlobalEvent('status-changed', status);
};

const runUserDataSync = async (uid: string) => {
	// synchronizeUserData opens a `stream-notify-user/${uid}/userData` sub
	// over DDPSDK. The server rejects that sub with "not-allowed" until
	// DDPSDK has completed loginWithToken on its own socket. Both
	// runUserDataSync and ensureConnectedAndAuthenticated are subscribers
	// of userIdStore, so without sequencing the sub races the auth and
	// hits the rejection on every re-login. Await the SDK auth here so
	// the sub fires authenticated.
	try {
		await ensureConnectedAndAuthenticated();
	} catch {
		// non-fatal: sdk.stream queues until DDPSDK eventually auths
	}
	const user = await synchronizeUserData(uid);
	if (!user) return;

	const utcOffset = -new Date().getTimezoneOffset() / 60;
	if (user.utcOffset !== utcOffset) {
		sdk.call('userSetUtcOffset', utcOffset);
	}

	emitStatusChange(user.status);
};

onLoggedIn(async () => {
	const uid = userIdStore.getState();
	if (!uid) return;
	await runUserDataSync(uid);
});

// Belt-and-braces: also drive synchronizeUserData directly off userIdStore so
// that even if the onLoggedIn / Accounts.onLogin / Tracker chain misses a
// re-login (we've seen this fail on logout → fresh login while
// loggedInAndDataReadyCallback's user-await autorun is wedged), the user doc
// still lands in the Users store. The sync function itself is idempotent.
let lastSyncedUid: string | undefined;
userIdStore.subscribe((uid) => {
	if (!uid || uid === lastSyncedUid) return;
	lastSyncedUid = uid;
	void runUserDataSync(uid);
});
if (userIdStore.getState()) {
	lastSyncedUid = userIdStore.getState();
	void runUserDataSync(userIdStore.getState() as string);
}

Users.use.subscribe(() => {
	const uid = userIdStore.getState();
	if (!uid) return;
	const user = Users.use.getState().get(uid);
	if (!user) return;
	emitStatusChange(user.status);
});

Accounts.onLogout(() => {
	removeLocalUserData();
	status = undefined;
	lastSyncedUid = undefined;
});

// Session-resume failure (expired stored token on page load): Meteor has already
// cleared Meteor.loginToken before this module runs, userId stays null, and no
// Accounts.onLogout callback fires for this scenario. Detect via the combination
// of missing token and missing uid at module init and clean up residual keys
// (e.g. E2EE public_key / private_key). Do NOT subscribe to userIdStore for this —
// the valid-session resume path is async and would clobber a valid token mid-flight.
if (!userIdStore.getState() && localStorage.getItem('Meteor.loginToken') === null) {
	removeLocalUserData();
}
