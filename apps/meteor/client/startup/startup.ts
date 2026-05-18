import type { UserStatus } from '@rocket.chat/core-typings';
import { Accounts } from 'meteor/accounts-base';

import 'highlight.js/styles/github.css';
import { sdk } from '../../app/utils/client/lib/SDKClient';
import { onLoggedIn } from '../lib/loggedIn';
import { ensureConnectedAndAuthenticated } from '../lib/sdk/ddpSdk';
import { isSdkTransportEnabled } from '../lib/sdk/sdkTransportEnabled';
import { userIdStore } from '../lib/user';
import { removeLocalUserData, synchronizeUserData } from '../lib/userData';
import { fireGlobalEvent } from '../lib/utils/fireGlobalEvent';
import { Users } from '../stores';

const sdkTransportEnabled = isSdkTransportEnabled();

let status: UserStatus | undefined = undefined;

const emitStatusChange = (next: UserStatus | undefined) => {
	if (next === status) return;
	status = next;
	fireGlobalEvent('status-changed', status);
};

if (!sdkTransportEnabled) {
	// Flag off: develop's exact onLoggedIn handler — single Accounts.onLogin
	// hook, no SDK auth gate, no syncOnce dedup, no userIdStore.subscribe
	// belt-and-braces.
	onLoggedIn(async () => {
		const uid = userIdStore.getState();
		if (!uid) return;

		const user = await synchronizeUserData(uid);
		if (!user) return;

		const utcOffset = -new Date().getTimezoneOffset() / 60;
		if (user.utcOffset !== utcOffset) {
			sdk.call('userSetUtcOffset', utcOffset);
		}

		emitStatusChange(user.status);
	});
} else {
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

	// Both `onLoggedIn` (from accounts-base) and `userIdStore.subscribe`
	// (belt-and-braces in case the loggedInAndDataReadyCallback's user-await
	// autorun gets wedged on logout → fresh login) fire for the same uid on a
	// successful login. runUserDataSync calls userSetUtcOffset which is
	// rate-limited on CI/prod, so without a shared guard the second call
	// returns 400 too-many-requests and downstream REST calls (sessions/list
	// etc.) start coming back 401 because the rate limiter throttles auth
	// checks for the rest of the window. Use a single guarded sync gate, but
	// reset it on failure so SAML/oauth/post-logout flows can retry — those
	// flows depend on a second runUserDataSync after the SDK socket finishes
	// authenticating, otherwise the userData stream subscription comes back
	// nosub and synchronizeUserData throws, leaving useUserDataSyncReady
	// false and the page stuck on PageLoading.
	let lastSyncedUid: string | undefined;
	const syncOnce = (uid: string | undefined): void => {
		// Reset on logout transitions so a subsequent re-login (same uid or different)
		// runs a fresh sync. Force-logout via the SDK loginWithToken wrap clears
		// creds via Accounts._unstoreLoginToken() + setUserId(null), which does NOT
		// fire Accounts.onLogout — so without this branch, lastSyncedUid stays set,
		// the next login is deduped, runUserDataSync is skipped, and
		// useUserDataSyncReady stays false (page wedged on PageLoading).
		if (!uid) {
			lastSyncedUid = undefined;
			return;
		}
		if (uid === lastSyncedUid) return;
		lastSyncedUid = uid;
		void runUserDataSync(uid).catch((err) => {
			console.warn('[startup] runUserDataSync failed; clearing dedup to allow a retry', err);
			if (lastSyncedUid === uid) lastSyncedUid = undefined;
		});
	};

	onLoggedIn(() => {
		syncOnce(userIdStore.getState());
	});

	userIdStore.subscribe((uid) => {
		syncOnce(uid);
	});

	syncOnce(userIdStore.getState());

	Accounts.onLogout(() => {
		lastSyncedUid = undefined;
	});
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
